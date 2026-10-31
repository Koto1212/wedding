import { Ornament } from "@/components/Ornament";
import { wedding } from "@/lib/wedding";

export function SiteFooter() {
  return (
    <footer className="bg-forest-deep px-5 py-16 text-center text-ivory md:px-8">
      <p className="script text-5xl md:text-6xl">
        {wedding.partnerOne} & {wedding.partnerTwo}
      </p>
      <p className="mt-4 text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
        {wedding.dateDisplay} · {wedding.city}
      </p>
      <Ornament className="mx-auto mt-8" />
      <p className="display mt-6 text-lg italic text-ivory/60">
        With love — we cannot wait to celebrate with you.
      </p>
    </footer>
  );
}
