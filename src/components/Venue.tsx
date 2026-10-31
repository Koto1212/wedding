import { Corner } from "@/components/Ornament";
import { Reveal } from "@/components/Reveal";
import { SectionHeading } from "@/components/SectionHeading";
import { wedding } from "@/lib/wedding";

export function Venue() {
  return (
    <section id="venue" className="section-pad bg-ivory-soft">
      <Reveal className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="Where" title="The venue" />

        <div className="relative mt-14 border border-gold/50 bg-ivory px-6 py-12 text-center sm:px-12">
          <Corner className="left-3 top-3" />
          <Corner className="right-3 top-3 rotate-90" />
          <Corner className="bottom-3 right-3 rotate-180" />
          <Corner className="bottom-3 left-3 -rotate-90" />

          <h3 className="display text-4xl text-forest md:text-5xl">{wedding.venue.name}</h3>
          <p className="mt-4 text-[0.78rem] font-semibold uppercase tracking-[0.22em] text-muted">
            {wedding.venue.address}
          </p>
          <div className="hairline mx-auto my-8 max-w-[10rem]" />
          <p className="display mx-auto max-w-md text-xl italic leading-relaxed text-muted">
            {wedding.venue.note}
          </p>
          <a
            href={wedding.venue.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-10"
          >
            Get directions
          </a>
        </div>
      </Reveal>
    </section>
  );
}
