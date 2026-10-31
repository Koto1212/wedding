import { ArabicMonogram } from "@/components/ArabicMonogram";
import { Corner, Ornament } from "@/components/Ornament";
import { content, type Locale } from "@/lib/i18n";

export function Hero({ locale }: { locale: Locale }) {
  const c = content(locale);

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-forest-deep px-4 py-24 md:py-28"
    >
      <div
        aria-hidden
        className="animate-drift absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#2a5a45_0%,transparent_45%),radial-gradient(ellipse_at_80%_80%,#1f4636_0%,transparent_45%),linear-gradient(160deg,var(--forest-deep)_0%,var(--forest)_50%,#0a1a14_100%)]"
      />

      {/* The invitation card */}
      <article className="animate-rise relative w-full max-w-xl bg-ivory-soft px-6 py-14 text-center text-ink shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)] sm:px-12 md:py-16">
        <div aria-hidden className="pointer-events-none absolute inset-3 border border-gold/60" />
        <div aria-hidden className="pointer-events-none absolute inset-[18px] border border-gold/25" />
        <Corner className="left-5 top-5" />
        <Corner className="right-5 top-5 rotate-90" />
        <Corner className="bottom-5 right-5 rotate-180" />
        <Corner className="bottom-5 left-5 -rotate-90" />

        {locale === "ar" ? (
          <ArabicMonogram className="mx-auto h-32 w-auto" title={c.couple.joined} />
        ) : (
          <p className="display text-2xl tracking-[0.12em] text-gold">{c.couple.monogram}</p>
        )}
        <Ornament className="mx-auto mt-5" />

        <p className="mt-8 text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-muted">
          {c.invite.opening}
        </p>

        <h1 className="script mt-6 text-[clamp(3.2rem,12vw,5.5rem)] leading-[1.1] text-forest">
          {c.couple.one}
          <span className="display mx-auto my-1 block text-[0.4em] italic text-gold">
            {c.couple.and}
          </span>
          {c.couple.two}
        </h1>

        <p className="display mx-auto mt-7 max-w-sm whitespace-pre-line text-xl italic leading-relaxed text-muted md:text-2xl">
          {c.invite.request}
        </p>

        <div className="mx-auto mt-9 flex max-w-sm items-center justify-center gap-4 text-forest">
          <span className="flex-1 border-y border-gold/50 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
            {c.date.weekday}
          </span>
          <span className="display text-5xl leading-none">{c.date.day}</span>
          <span className="flex-1 border-y border-gold/50 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em]">
            {c.date.month}
          </span>
        </div>

        <p className="display mt-6 text-xl text-forest md:text-2xl">{c.date.yearWords}</p>
        <p className="display mt-1 text-lg italic text-muted md:text-xl">{c.date.timeWords}</p>

        <div className="mt-8">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-forest">
            {c.venue.name}
          </p>
          <p className="mt-2 text-sm text-muted">{c.venue.city}</p>
        </div>

        <div className="hairline mx-auto mt-8 max-w-[8rem]" />
        <p className="display mt-4 text-lg italic text-muted">{c.invite.cardLine}</p>

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="#rsvp" className="btn-primary">
            {c.invite.reply}
          </a>
          <a
            href="#details"
            className="btn-primary !bg-transparent !text-forest border border-gold/60 hover:!bg-gold/10"
          >
            {c.invite.details}
          </a>
        </div>
      </article>

      <a
        href="#story"
        aria-label={c.invite.scrollLabel}
        className="animate-fade delay-4 absolute bottom-6 left-1/2 -translate-x-1/2 text-gold-soft/80 hover:text-gold-soft"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}
