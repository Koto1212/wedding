import type { ReactNode } from "react";
import { Ornament } from "@/components/Ornament";

// Shared look for the error and not-found pages: the invitation's colours,
// with the message in English and Arabic since we don't know who's reading.
export function FallbackPage({
  en,
  ar,
  children,
}: {
  en: { title: string; body: string };
  ar: { title: string; body: string };
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-[100svh] flex-col items-center justify-center bg-forest-deep px-6 py-16 text-center text-ivory">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-gold-soft">M &amp; A</p>
      <h1 className="display mt-4 text-4xl md:text-5xl">{en.title}</h1>
      <p className="mt-3 max-w-md text-ivory/75">{en.body}</p>
      <Ornament className="mx-auto my-8" />
      <div lang="ar" dir="rtl">
        <p className="display text-3xl md:text-4xl">{ar.title}</p>
        <p className="mt-3 max-w-md text-ivory/75">{ar.body}</p>
      </div>
      <div className="mt-10 flex flex-wrap justify-center gap-3">{children}</div>
    </main>
  );
}
