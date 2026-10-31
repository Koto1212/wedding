import nodemailer, { type Transporter } from "nodemailer";
import QRCode from "qrcode";
import { getGmailCredentials } from "./gmail";
import { getGoogleAccount, isGoogleConfigured } from "./google";
import { content } from "./i18n";
import { toWhatsappNumber } from "./phone";
import { siteUrl } from "./site";
import type { Guest } from "./types";
import { wedding } from "./wedding";

type Sender = { from: string; transport: Transporter };

// Give up on a slow Gmail quickly so an RSVP is never left hanging; the
// hosts can resend the pass from the dashboard.
const SMTP_TIMEOUTS = {
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 7000,
};
const SEND_DEADLINE_MS = 8000;

function appPasswordSender(user: string, pass: string): Sender {
  return {
    from: user,
    transport: nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      ...SMTP_TIMEOUTS,
    }),
  };
}

// Prefer the Gmail saved on the dashboard; then Google sign-in; then .env.
async function getSender(): Promise<Sender | null> {
  const saved = await getGmailCredentials();
  if (saved) return appPasswordSender(saved.email, saved.appPassword);

  const google = isGoogleConfigured() ? await getGoogleAccount() : null;
  if (google) {
    return {
      from: google.email,
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: google.email,
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          refreshToken: google.refreshToken,
        },
        ...SMTP_TIMEOUTS,
      }),
    };
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return appPasswordSender(process.env.GMAIL_USER, process.env.GMAIL_APP_PASSWORD);
  }

  return null;
}

export async function isMailConfigured(): Promise<boolean> {
  return (await getSender()) !== null;
}

export function checkInUrl(guest: Guest): string {
  return `${siteUrl()}/api/checkin/${guest.checkInToken}`;
}

// Guest-facing page showing their QR; this is what WhatsApp messages link to.
export function passUrl(guest: Guest): string {
  return `${siteUrl()}/pass/${guest.checkInToken}`;
}

// wa.me link that opens WhatsApp with the guest's pass message ready to send.
export function whatsappLink(guest: Guest): string | null {
  const number = toWhatsappNumber(guest.phone);
  if (!number || guest.status !== "attending") return null;

  // The pass link comes first so WhatsApp previews it as the pass card; no
  // emoji, since WhatsApp Desktop on Windows garbles them from wa.me links.
  const text = content(guest.locale).whatsapp(guest.name, passUrl(guest));
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function emailHtml(guest: Guest): string {
  const c = content(guest.locale);
  const rtl = c.dir === "rtl";
  const name = escapeHtml(guest.name);
  // Arabic: a font every mail app has, and no letter spacing or italics,
  // which break joined Arabic letters.
  const serif = rtl ? "Tahoma,Arial,sans-serif" : "Georgia,'Times New Roman',serif";
  const sans = rtl ? "Tahoma,Arial,sans-serif" : "Arial,Helvetica,sans-serif";
  const spacing = (px: number) => (rtl ? "0" : `${px}px`);
  const italic = rtl ? "normal" : "italic";

  return `<!doctype html>
<html lang="${c.locale}" dir="${c.dir}">
  <body style="margin:0;padding:0;background:#163428;" dir="${c.dir}">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#163428;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#faf7f1;border:1px solid #b8923f;">
            <tr>
              <td align="center" style="padding:44px 32px 12px;font-family:${serif};color:#163428;">
                <p style="margin:0;font-size:13px;letter-spacing:${spacing(4)};text-transform:uppercase;color:#b8923f;">${escapeHtml(c.couple.monogram)}</p>
                <p style="margin:24px 0 0;font-size:34px;font-style:${italic};line-height:1.3;">${escapeHtml(c.couple.joined)}</p>
                <p style="margin:12px 0 0;font-size:13px;letter-spacing:${spacing(3)};text-transform:uppercase;color:#5c6b62;">${escapeHtml(c.date.display)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 36px 0;font-family:${serif};color:#14201a;font-size:17px;line-height:1.7;">
                ${escapeHtml(c.email.greeting(guest.name))}<br />
                ${escapeHtml(c.email.intro)}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 8px;">
                <img src="cid:entry-pass" width="220" height="220" alt="${escapeHtml(c.email.qrAlt)}" style="display:block;border:8px solid #ffffff;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 0;font-family:${sans};font-size:12px;letter-spacing:${spacing(3)};text-transform:uppercase;color:#163428;font-weight:bold;">
                ${name} · ${escapeHtml(c.pass.admits(guest.guestCount))}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px 0;font-family:${serif};color:#5c6b62;font-size:15px;line-height:1.7;">
                ${escapeHtml(c.date.time)}<br />
                ${escapeHtml(c.venue.name)} · ${escapeHtml(c.venue.city)}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#163428" style="background:#163428;">
                      <a href="${escapeHtml(wedding.venue.mapUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${sans};font-size:${rtl ? "14px" : "12px"};font-weight:bold;letter-spacing:${spacing(3)};text-transform:uppercase;color:#f3efe6;text-decoration:none;">
                        ${escapeHtml(c.venue.viewLocation)}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px 44px;font-family:${serif};color:#5c6b62;font-size:14px;font-style:${italic};line-height:1.7;">
                ${escapeHtml(c.email.personal)}<br />
                ${escapeHtml(c.adultsHint)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendQrEmail(guest: Guest): Promise<void> {
  const sender = await getSender();
  if (!sender) {
    throw new Error("Email is not set up. Add your Gmail on the dashboard first.");
  }
  if (!guest.email || guest.email === "unlisted@local") {
    throw new Error("This guest has no email address.");
  }

  const qrPng = await QRCode.toBuffer(checkInUrl(guest), {
    width: 440,
    margin: 1,
    color: { dark: "#0d2219", light: "#ffffff" },
  });

  const c = content(guest.locale);
  const sending = sender.transport.sendMail({
    from: `"${c.couple.joined}" <${sender.from}>`,
    to: guest.email,
    subject: c.email.subject,
    text: c.email.text(guest.name),
    html: emailHtml(guest),
    attachments: [
      {
        filename: "entry-pass.png",
        content: qrPng,
        cid: "entry-pass",
      },
    ],
  });

  // Hard stop in case Gmail stalls mid-send despite the socket timeouts.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      sending,
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Gmail took too long to respond. Please try again.")),
          SEND_DEADLINE_MS,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}
