"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/lib/wedding";

const links = [
  { href: "#story", label: "Story" },
  { href: "#details", label: "Attire" },
  { href: "#venue", label: "Venue" },
  { href: "#rsvp", label: "RSVP" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);

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
        <a href="#top" className="display text-xl tracking-wide md:text-2xl">
          {wedding.monogram}
        </a>
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
        <a href="#rsvp" className="btn-ghost !px-4 !py-2 text-[0.65rem] md:!hidden">
          RSVP
        </a>
      </nav>
    </header>
  );
}
