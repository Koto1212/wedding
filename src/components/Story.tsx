import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { content, type Locale } from "@/lib/i18n";

export function Story({ locale }: { locale: Locale }) {
  const c = content(locale);

  return (
    <section id="story" className="section-pad bg-ivory">
      <Reveal className="mx-auto max-w-2xl">
        <SectionHeading eyebrow={c.story.eyebrow} title={c.story.headline} />
        <p className="display mt-10 text-center text-2xl italic leading-relaxed text-muted md:text-[1.7rem] md:leading-[1.6]">
          {c.story.body}
        </p>
        <p className="script mt-10 text-center text-4xl text-gold">{c.couple.joined}</p>
      </Reveal>
    </section>
  );
}
