import { Ornament } from "@/components/Ornament";
import { content, type Locale } from "@/lib/i18n";

export function SiteFooter({ locale }: { locale: Locale }) {
  const c = content(locale);

  return (
    <footer className="bg-forest-deep px-5 py-16 text-center text-ivory md:px-8">
      <p className="script text-5xl md:text-6xl">{c.couple.joined}</p>
      <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
        {c.date.display} · {c.venue.city}
      </p>
      <Ornament className="mx-auto mt-8" />
      <p className="display mt-6 text-lg italic text-ivory/60">{c.footer}</p>
    </footer>
  );
}
