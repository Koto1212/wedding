import Image from "next/image";

// The couple's gold ع and م monogram for the Arabic pages. The artwork is
// public/monogram-ar.png (cut out of the original photo, transparent background).
export function ArabicMonogram({
  className = "",
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <Image
      src="/monogram-ar.png"
      width={870}
      height={1296}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={`object-contain ${className}`}
      priority
    />
  );
}
