import { Ornament } from "@/components/Ornament";

export function SectionHeading({
  eyebrow,
  title,
  light = false,
}: {
  eyebrow: string;
  title: string;
  light?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-[0.72rem] font-semibold uppercase tracking-[0.3em] ${
          light ? "text-gold-soft" : "text-gold"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`script mt-3 text-6xl md:text-7xl ${light ? "text-ivory" : "text-forest"}`}
      >
        {title}
      </h2>
      <Ornament className="mx-auto mt-5" />
    </div>
  );
}
