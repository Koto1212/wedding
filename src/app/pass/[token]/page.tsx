import { Suspense } from "react";
import type { Metadata } from "next";
import QRCode from "qrcode";
import { Corner, Ornament } from "@/components/Ornament";
import { getGuestByToken } from "@/lib/db";
import { checkInUrl } from "@/lib/mailer";
import { CARD_SIZE } from "@/lib/passCard";
import { siteUrl } from "@/lib/site";
import { wedding } from "@/lib/wedding";

type Props = { params: Promise<{ token: string }> };

// WhatsApp builds its link preview from these tags, so the chat shows the
// pass card image (with the QR) above the message.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const title = `Your entry pass — ${wedding.partnerOne} & ${wedding.partnerTwo}`;
  const description = `${wedding.dateDisplay} · ${wedding.venue.name}, ${wedding.city}. Please show this pass at the door.`;
  const image = {
    url: `${siteUrl()}/pass/${encodeURIComponent(token)}/card.png`,
    ...CARD_SIZE,
    alt: "Entry pass with QR code",
  };
  return {
    title,
    description,
    robots: { index: false },
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });
}

async function Pass({ params }: Props) {
  const { token } = await params;
  const guest = await getGuestByToken(token);

  if (!guest || guest.status !== "attending") {
    return (
      <div className="mx-auto max-w-sm py-24 text-center text-ivory">
        <p className="display text-4xl">Pass not active</p>
        <p className="mt-4 text-ivory/70">
          This pass isn&apos;t valid. If you think that&apos;s a mistake, please
          contact {wedding.partnerOne} & {wedding.partnerTwo}.
        </p>
      </div>
    );
  }

  const qrSvg = await QRCode.toString(checkInUrl(guest), {
    type: "svg",
    margin: 1,
    color: { dark: "#0d2219", light: "#ffffff" },
  });
  const party = guest.guestCount > 1 ? `Admits ${guest.guestCount} guests` : "Admits 1 guest";

  return (
    <article className="animate-rise relative mx-auto w-full max-w-md bg-ivory-soft px-6 py-12 text-center text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] sm:px-10">
      <div aria-hidden className="pointer-events-none absolute inset-3 border border-gold/60" />
      <Corner className="left-5 top-5" />
      <Corner className="right-5 top-5 rotate-90" />
      <Corner className="bottom-5 right-5 rotate-180" />
      <Corner className="bottom-5 left-5 -rotate-90" />

      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-gold">
        Entry pass
      </p>
      <h1 className="script mt-3 text-5xl text-forest">
        {wedding.partnerOne} & {wedding.partnerTwo}
      </h1>
      <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted">
        {wedding.dateDisplay}
      </p>
      <Ornament className="mx-auto mt-5" />

      <div className="relative mx-auto mt-7 w-full max-w-[16rem]">
        <div
          className={`border-8 border-white bg-white shadow-sm [&_svg]:block [&_svg]:h-auto [&_svg]:w-full ${
            guest.checkedInAt ? "opacity-25" : ""
          }`}
          role="img"
          aria-label="Your entry QR code"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
        {guest.checkedInAt ? (
          <p className="absolute inset-0 flex items-center justify-center">
            <span className="bg-forest px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ivory">
              Checked in {formatTime(guest.checkedInAt)}
            </span>
          </p>
        ) : null}
      </div>

      <p className="mt-6 text-[0.75rem] font-semibold uppercase tracking-[0.24em] text-forest">
        {guest.name} · {party}
      </p>

      <p className="display mt-6 text-lg italic text-muted">{wedding.timeDisplay}</p>
      <p className="mt-1 text-sm text-muted">{wedding.venue.name}</p>
      <p className="text-sm text-muted">{wedding.venue.address}</p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a
          href={wedding.venue.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          View location
        </a>
        <a
          href={`/pass/${encodeURIComponent(token)}/card.png`}
          download="entry-pass.png"
          className="btn-primary !bg-transparent !text-forest border border-gold/60 hover:!bg-gold/10"
        >
          Save image
        </a>
      </div>

      <div className="hairline mx-auto mt-8 max-w-[8rem]" />
      <p className="display mt-4 text-base italic text-muted">
        Please show this at the door. It works once — kindly don&apos;t share it.
      </p>
      <p className="display mt-1 text-base italic text-muted">
        {wedding.adultsOnly.rsvpHint}
      </p>
    </article>
  );
}

export default function PassPage(props: Props) {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-forest-deep px-4 py-10">
      <Suspense fallback={<p className="text-ivory/70">Loading your pass…</p>}>
        <Pass {...props} />
      </Suspense>
    </main>
  );
}
