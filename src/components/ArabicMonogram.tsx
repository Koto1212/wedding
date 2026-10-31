import Image from "next/image";

// The couple's ع and م monogram for the Arabic pages: flat forest green for
// light backgrounds, soft gold for dark ones. The artwork is
// public/monogram-ar-{green,gold}.png (cut out of the original photo,
// transparent background).
export function ArabicMonogram({
  className = "",
  tone = "green",
  title,
}: {
  className?: string;
  tone?: "green" | "gold";
  title?: string;
}) {
  return (
    <Image
      src={tone === "gold" ? "/monogram-ar-gold.png" : "/monogram-ar-green.png"}
      width={870}
      height={1296}
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      className={`object-contain ${className}`}
      priority
    />
  );
}
