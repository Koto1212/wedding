import { Suspense } from "react";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { Corner, Ornament } from "@/components/Ornament";
import { getGuestByToken } from "@/lib/db";
import { arabicDigits, content } from "@/lib/i18n";
import { checkInUrl } from "@/lib/mailer";
import { CARD_SIZE } from "@/lib/passCard";
import { siteUrl } from "@/lib/site";
import { wedding } from "@/lib/wedding";

type Props = { params: Promise<{ token: string }> };

// WhatsApp builds its link preview from these tags, so the chat shows the
// pass card image (with the QR) above the message, in the guest's language.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  const c = content(guest?.locale);
  const image = {
    url: `${siteUrl()}/pass/${encodeURIComponent(token)}/card.png`,
    ...CARD_SIZE,
    alt: c.pass.imageAlt,
  };
  return {
    title: c.pass.title,
    description: c.pass.description,
    robots: { index: false },
    openGraph: {
      title: c.pass.title,
      description: c.pass.description,
      images: [image],
      type: "website",
      locale: c.locale === "ar" ? "ar_JO" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: c.pass.title,
      description: c.pass.description,
      images: [image.url],
    },
  };
}

function formatTime(iso: string, arabic: boolean): string {
  const time = new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });
  return arabic ? arabicDigits(time) : time;
}

async function Pass({ params }: Props) {
  const { token } = await params;
  const guest = await getGuestByToken(token);

  if (!guest || guest.status !== "attending") {
    // We don't know the guest's language here, so say it in both.
    const en = content("en");
    const ar = content("ar");
    return (
      <div className="mx-auto max-w-sm space-y-10 py-24 text-center text-ivory">
        <div>
          <p className="display text-4xl">{en.pass.inactiveTitle}</p>
          <p className="mt-4 text-ivory/70">{en.pass.inactiveBody}</p>
        </div>
        <div lang="ar" dir="rtl">
          <p className="display text-4xl">{ar.pass.inactiveTitle}</p>
          <p className="mt-4 text-ivory/70">{ar.pass.inactiveBody}</p>
        </div>
      </div>
    );
  }

  const c = content(guest.locale);
  const qrSvg = await QRCode.toString(checkInUrl(guest), {
    type: "svg",
    margin: 1,
    color: { dark: "#0d2219", light: "#ffffff" },
  });

  return (
    <article
      lang={c.locale}
      dir={c.dir}
      className="animate-rise relative mx-auto w-full max-w-md bg-ivory-soft px-6 py-12 text-center text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] sm:px-10"
    >
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-gold/60" />
      <Corner className="left-5 top-5" />
      <Corner className="right-5 top-5 rotate-90" />
      <Corner className="bottom-5 right-5 rotate-180" />
      <Corner className="bottom-5 left-5 -rotate-90" />

      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-gold">
        {c.pass.eyebrow}
      </p>
      <h1 className="script mt-3 text-5xl text-forest">{c.couple.joined}</h1>
      <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted">
        {c.date.display}
      </p>
      <Ornament className="mx-auto mt-5" />

      <div className="relative mx-auto mt-7 w-full max-w-[16rem]">
        <div
          className={`border-8 border-white bg-white shadow-sm [&_svg]:block [&_svg]:h-auto [&_svg]:w-full ${
            guest.checkedInAt ? "opacity-25" : ""
          }`}
          role="img"
          aria-label={c.pass.qrLabel}
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        {guest.checkedInAt ? (
          <p className="absolute inset-0 flex items-center justify-center">
            <span className="bg-forest px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory">
              {c.pass.checkedIn} {formatTime(guest.checkedInAt, c.locale === "ar")}
            </span>
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-forest">
        {guest.name} · {c.pass.admits(guest.guestCount)}
      </p>

      <p className="display mt-6 text-lg italic text-muted">{c.date.time}</p>
      <p className="mt-1 text-sm text-muted">{c.venue.name}</p>
      <p className="text-sm text-muted">{c.venue.address}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a
          href={wedding.venue.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          {c.venue.viewLocation}
        </a>
        <a
          href={`/pass/${encodeURIComponent(token)}/card.png`}
          download="entry-pass.png"
          className="btn-primary !bg-transparent !text-forest border border-gold/60 hover:!bg-gold/10"
        >
          {c.pass.saveImage}
        </a>
      </div>

      <div className="hairline mx-auto mt-8 max-w-[8rem]" />
      <p className="display mt-4 text-base italic text-muted">{c.pass.showAtDoor}</p>
      <p className="display mt-1 text-base italic text-muted">{c.adultsHint}</p>
    </article>
  );
}

export default function PassPage(props: Props) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-forest-deep px-4 py-10">
      <Suspense fallback={<p className="text-ivory/70">…</p>}>
        <Pass {...props} />
      </Suspense>
    </main>
  );
}
