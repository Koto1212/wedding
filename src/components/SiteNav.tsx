"use client";

import { useEffect, useState } from "react";
import { ArabicMonogram } from "@/components/ArabicMonogram";
import { content, type Locale } from "@/lib/i18n";

export function SiteNav({ locale }: { locale: Locale }) {
  const c = content(locale);
  const [scrolled, setScrolled] = useState(false);

  const links = [
    { href: "#story", label: c.nav.story },
    { href: "#details", label: c.nav.attire },
    { href: "#venue", label: c.nav.venue },
    { href: "#rsvp", label: c.nav.rsvp },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "bg-forest-deep/90 text-ivory backdrop-blur-md"
          : "bg-transparent text-ivory"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <a href="#top" aria-label={c.couple.joined} className="display text-xl tracking-wide md:text-2xl">
          {locale === "ar" ? (
            <ArabicMonogram tone="gold" className="h-9 w-auto md:h-10" />
          ) : (
            c.couple.monogram
          )}
        </a>
        <div className="flex items-center gap-6 md:gap-8">
          <ul className="hidden items-center gap-8 text-[0.72rem] font-semibold uppercase tracking-[0.18em] md:flex">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="opacity-85 transition hover:text-gold-soft hover:opacity-100"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href={c.nav.switchHref}
            lang={locale === "ar" ? "en" : "ar"}
            className="border-b border-gold-soft/60 pb-0.5 text-sm text-gold-soft transition hover:border-gold-soft hover:text-ivory"
            style={{ fontFamily: locale === "ar" ? "var(--font-body)" : "var(--font-arabic)" }}
          >
            {c.nav.switchLabel}
          </a>
          <a href="#rsvp" className="btn-ghost !px-4 !py-2 text-[0.65rem] md:!hidden">
            {c.nav.rsvp}
          </a>
        </div>
      </nav>
    </header>
  );
}
