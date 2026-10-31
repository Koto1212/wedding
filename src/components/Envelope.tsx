"use client";

import { useEffect, useState } from "react";
import { wedding } from "@/lib/wedding";

type Stage = "closed" | "open" | "rise" | "leave" | "gone";

export function Envelope() {
  const [stage, setStage] = useState<Stage>("closed");

  useEffect(() => {
    document.body.style.overflow = stage === "gone" ? "" : "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [stage]);

  function open() {
    if (stage !== "closed") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setStage("gone");
      return;
    }
    setStage("open");
    setTimeout(() => setStage("rise"), 650);
    setTimeout(() => setStage("leave"), 1900);
    setTimeout(() => setStage("gone"), 2700);
  }

  if (stage === "gone") return null;

  const opened = stage !== "closed";
  const risen = stage === "rise" || stage === "leave";

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-forest-deep px-4 transition-opacity duration-700 ${
        stage === "leave" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,#2a5a45_0%,transparent_60%)] opacity-70"
      />

      <p
        className={`relative mb-10 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-gold-soft transition-opacity duration-500 ${
          opened ? "opacity-0" : "opacity-100"
        }`}
      >
        You are cordially invited
      </p>

      <button
        type="button"
        onClick={open}
        aria-label="Open the invitation"
        className="group relative aspect-[3/2] w-[min(88vw,520px)] cursor-pointer [perspective:1200px] focus-visible:outline-none"
      >
        {/* Envelope back */}
        <div className="absolute inset-0 bg-[#e9e2d3] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]" />

        {/* Card inside */}
        <div
          className={`absolute inset-x-[6%] top-[6%] bottom-[6%] z-10 flex flex-col items-center justify-center border border-gold/40 bg-ivory-soft transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            risen ? "-translate-y-[55%]" : "translate-y-0"
          }`}
        >
          <span className="script text-4xl text-forest md:text-5xl">
            {wedding.partnerOne} & {wedding.partnerTwo}
          </span>
          <span className="mt-2 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-gold">
            {wedding.dateDisplay}
          </span>
        </div>

        {/* Front pocket */}
        <div
          className="absolute inset-0 z-20 bg-[#f1ebdf]"
          style={{ clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)" }}
        />
        <div
          className="absolute inset-0 z-20 bg-[linear-gradient(to_top_right,transparent_49.6%,rgba(22,52,40,0.08)_50%,transparent_50.4%),linear-gradient(to_top_left,transparent_49.6%,rgba(22,52,40,0.08)_50%,transparent_50.4%)]"
          style={{ clipPath: "polygon(0 0, 50% 56%, 100% 0, 100% 100%, 0 100%)" }}
        />

        {/* Flap */}
        <div
          className={`absolute inset-x-0 top-0 h-[58%] origin-top bg-[#e4dccb] transition-transform duration-700 ease-in-out [backface-visibility:visible] ${
            opened ? "[transform:rotateX(180deg)]" : ""
          } ${risen ? "z-0" : "z-30"}`}
          style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
        />

        {/* Wax seal */}
        <div
          className={`absolute left-1/2 top-[58%] z-40 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,var(--gold-soft),var(--gold)_55%,#8a6a28)] shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition-[opacity,transform] duration-500 md:h-20 md:w-20 ${
            opened ? "scale-75 opacity-0" : "group-hover:scale-105"
          }`}
        >
          <span className="display text-lg text-forest-deep md:text-xl">
            {wedding.monogram.replace(/\s/g, "")}
          </span>
        </div>
      </button>

      <p
        className={`relative mt-10 text-sm tracking-[0.12em] text-ivory/70 transition-opacity duration-500 ${
          opened ? "opacity-0" : "animate-pulse opacity-100"
        }`}
      >
        Tap the seal to open
      </p>
    </div>
  );
}
