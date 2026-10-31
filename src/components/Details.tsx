import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { content, type Locale } from "@/lib/i18n";

export function Details({ locale }: { locale: Locale }) {
  const c = content(locale);

  return (
    <section id="details" className="section-pad relative overflow-hidden bg-forest text-ivory">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#2a5a45_0%,transparent_60%)] opacity-60"
      />
      <Reveal className="relative mx-auto max-w-4xl">
        <SectionHeading eyebrow={c.attire.eyebrow} title={c.attire.title} light />
        <p className="display mt-10 text-center text-3xl italic md:text-4xl">
          {c.attire.dressCode}
        </p>

        <div className="hairline mx-auto my-12 max-w-[10rem]" />

        <div className="mx-auto max-w-xl text-center">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            {c.attire.adultsTitle}
          </p>
          <p className="display mt-4 text-xl italic leading-relaxed text-ivory/80 md:text-2xl">
            {c.attire.adultsNote}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
