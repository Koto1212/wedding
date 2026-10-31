import nodemailer, { type Transporter } from "nodemailer";
import QRCode from "qrcode";
import { getGoogleAccount, isGoogleConfigured } from "./google";
import { toWhatsappNumber } from "./phone";
import { siteUrl } from "./site";
import type { Guest } from "./types";
import { wedding } from "./wedding";

type Sender = { from: string; transport: Transporter };

// Prefer the Gmail account connected with "Sign in with Google"; fall back to
// a Gmail app password from .env.local.
async function getSender(): Promise<Sender | null> {
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
      }),
    };
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return {
      from: process.env.GMAIL_USER,
      transport: nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      }),
    };
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

  const text = [
    `Dear ${guest.name},`,
    "",
    `We're so happy you'll be celebrating with us! Here is your personal entry pass for ${wedding.partnerOne} & ${wedding.partnerTwo}'s wedding — please show the QR code at the door:`,
    // First link in the message, so WhatsApp previews it as the pass card.
    passUrl(guest),
    "",
    // No emoji: WhatsApp Desktop on Windows garbles them when they arrive
    // through a wa.me link.
    `Date: ${wedding.invitation.weekday}, ${wedding.dateDisplay} · ${wedding.timeDisplay}`,
    `Location: ${wedding.venue.name}, ${wedding.venue.address}`,
    // Second link: WhatsApp previews only the first, so the pass card stays.
    wedding.venue.mapUrl,
    "",
    wedding.adultsOnly.rsvpHint,
  ].join("\n");

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
  const name = escapeHtml(guest.name);
  const couple = `${wedding.partnerOne} &amp; ${wedding.partnerTwo}`;
  const party =
    guest.guestCount > 1 ? `Admits ${guest.guestCount} guests` : "Admits 1 guest";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#163428;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#163428;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#faf7f1;border:1px solid #b8923f;">
            <tr>
              <td align="center" style="padding:44px 32px 12px;font-family:Georgia,'Times New Roman',serif;color:#163428;">
                <p style="margin:0;font-size:13px;letter-spacing:4px;text-transform:uppercase;color:#b8923f;">${escapeHtml(wedding.monogram)}</p>
                <p style="margin:24px 0 0;font-size:34px;font-style:italic;line-height:1.2;">${couple}</p>
                <p style="margin:12px 0 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#5c6b62;">${escapeHtml(wedding.dateDisplay)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 36px 0;font-family:Georgia,'Times New Roman',serif;color:#14201a;font-size:17px;line-height:1.6;">
                Dear ${name},<br />
                thank you for your reply — we are so happy you will be celebrating with us.
                Please bring this pass to the door; it will be scanned when you arrive.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 32px 8px;">
                <img src="cid:entry-pass" width="220" height="220" alt="Your entry QR code" style="display:block;border:8px solid #ffffff;" />
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:8px 32px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#163428;font-weight:bold;">
                ${name} · ${party}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px 0;font-family:Georgia,'Times New Roman',serif;color:#5c6b62;font-size:15px;line-height:1.6;">
                ${escapeHtml(wedding.timeDisplay)}<br />
                ${escapeHtml(wedding.venue.name)} · ${escapeHtml(wedding.city)}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:20px 32px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#163428" style="background:#163428;">
                      <a href="${escapeHtml(wedding.venue.mapUrl)}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;color:#f3efe6;text-decoration:none;">
                        View location
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 36px 44px;font-family:Georgia,'Times New Roman',serif;color:#5c6b62;font-size:14px;font-style:italic;line-height:1.6;">
                This code is personal and works once — please don't share it.<br />
                ${escapeHtml(wedding.adultsOnly.rsvpHint)}
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
    throw new Error("Email is not set up. Sign in with Google on the dashboard first.");
  }
  if (!guest.email || guest.email === "unlisted@local") {
    throw new Error("This guest has no email address.");
  }

  const qrPng = await QRCode.toBuffer(checkInUrl(guest), {
    width: 440,
    margin: 1,
    color: { dark: "#0d2219", light: "#ffffff" },
  });

  await sender.transport.sendMail({
    from: `"${wedding.partnerOne} & ${wedding.partnerTwo}" <${sender.from}>`,
    to: guest.email,
    subject: `Your entry pass — ${wedding.partnerOne} & ${wedding.partnerTwo}, ${wedding.dateDisplay}`,
    text: `Dear ${guest.name},\n\nThank you for your reply! Your personal entry QR code is attached — please bring it to the door on ${wedding.dateDisplay}. It works once, so please don't share it.\n\n${wedding.venue.name}, ${wedding.city}\nLocation: ${wedding.venue.mapUrl}\n\n${wedding.partnerOne} & ${wedding.partnerTwo}`,
    html: emailHtml(guest),
    attachments: [
      {
        filename: "entry-pass.png",
        content: qrPng,
        cid: "entry-pass",
      },
    ],
  });
}
