import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { wedding } from "@/lib/wedding";

export function Story() {
  return (
    <section id="story" className="section-pad bg-ivory">
      <Reveal className="mx-auto max-w-2xl">
        <SectionHeading eyebrow="Chapter one" title={wedding.story.headline} />
        <p className="display mt-10 text-center text-2xl italic leading-relaxed text-muted md:text-[1.7rem] md:leading-[1.6]">
          {wedding.story.body}
        </p>
        <p className="script mt-10 text-center text-4xl text-gold">
          {wedding.partnerOne} & {wedding.partnerTwo}
        </p>
      </Reveal>
    </section>
  );
}
