import { ImageResponse } from "next/og";
import type { CSSProperties } from "react";
import QRCode from "qrcode";
import { content } from "./i18n";
import { checkInUrl } from "./mailer";
import type { Guest } from "./types";

// Landscape so WhatsApp shows it as a large link preview.
export const CARD_SIZE = { width: 1200, height: 630 };

const FOREST = "#163428";
const FOREST_DEEP = "#0d2219";
const IVORY = "#faf7f1";
const GOLD = "#b8923f";
const MUTED = "#5c6b62";

const ARABIC_ALPHABET = "ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىي٠١٢٣٤٥٦٧٨٩،؛؟ـ";

// Every character a card can need, so each font is fetched once and reused
// for every guest (a per-name subset would mean a Google round trip per card).
const LATIN_CHARS = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join("") + "·—’";
const FONT_TIMEOUT_MS = 4000;

type CardFont = {
  name: string;
  data: ArrayBuffer;
  style: "normal" | "italic";
  weight: 400;
};

// Kept for the life of the server instance; failed loads aren't cached, so
// they're retried on the next card.
const fontCache = new Map<string, Promise<CardFont | null>>();

// Fetches a Google font as TTF. If it can't be loaded in time the card still
// renders in the built-in font.
function loadFont(family: string, text: string, italic = false): Promise<CardFont | null> {
  const key = `${family}|${italic}`;
  const cached = fontCache.get(key);
  if (cached) return cached;

  const loading = (async () => {
    try {
      const spec = italic ? ":ital@1" : "";
      const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}${spec}&text=${encodeURIComponent(text)}`;
      const signal = AbortSignal.timeout(FONT_TIMEOUT_MS);
      const css = await (await fetch(url, { signal })).text();
      const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
      if (!src) throw new Error("no font file");
      const data = await (await fetch(src, { signal })).arrayBuffer();
      return { name: family, data, style: italic ? ("italic" as const) : ("normal" as const), weight: 400 as const };
    } catch {
      fontCache.delete(key);
      return null;
    }
  })();
  fontCache.set(key, loading);
  return loading;
}

// The image renderer joins Arabic letters but lays words out left to right,
// so Arabic lines are split into words placed from the right. Runs of Latin
// words (e.g. a guest name typed in English) stay together in their order.
function RtlLine({ text, style }: { text: string; style: CSSProperties }) {
  const tokens: string[] = [];
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const latin = /^[\x00-\x7F]+$/.test(word) && /[A-Za-z0-9]/.test(word);
    const prev = tokens[tokens.length - 1];
    if (latin && prev !== undefined && /^[\x00-\x7F ]+$/.test(prev) && /[A-Za-z0-9]/.test(prev)) {
      tokens[tokens.length - 1] = `${prev} ${word}`;
    } else {
      tokens.push(word);
    }
  }
  return (
    <div style={{ ...style, display: "flex", flexDirection: "row-reverse", gap: "0.2em" }}>
      {tokens.map((token, i) => (
        <span key={i}>{token}</span>
      ))}
    </div>
  );
}

export async function renderPassCard(guest: Guest): Promise<ImageResponse> {
  const c = content(guest.locale);
  const rtl = c.dir === "rtl";
  const qr = await QRCode.toDataURL(checkInUrl(guest), {
    width: 460,
    margin: 1,
    color: { dark: FOREST_DEEP, light: "#ffffff" },
  });

  // Arabic vowel marks pull in font features the image renderer can't read
  // yet, so they're dropped on the card (the text reads fine without them).
  const plain = (s: string) => (rtl ? s.replace(/[ً-ٰٟ]/g, "") : s);
  const couple = plain(c.couple.joined);
  const lines = [
    c.pass.eyebrow,
    c.date.display,
    `${guest.name} · ${c.pass.admits(guest.guestCount)}`,
    c.date.time,
    c.venue.name,
    c.venue.address,
    c.pass.cardFooter,
  ].map(plain);
  // Latin fonts are always loaded so English text (or a guest name typed in
  // English on the Arabic card) still has glyphs. Latin fonts only get Latin
  // letters; Arabic letters make them fail to load.
  const fonts = (
    await Promise.all([
      rtl ? null : loadFont("Pinyon Script", LATIN_CHARS),
      loadFont("Cormorant Garamond", LATIN_CHARS),
      rtl ? null : loadFont("Cormorant Garamond", LATIN_CHARS, true),
      // Most Arabic fonts (including Amiri and Aref Ruqaa used on the website)
      // use features the image renderer can't read yet or don't join letters
      // here; El Messiri works with the whole alphabet, so any name renders.
      rtl ? loadFont("El Messiri", ARABIC_ALPHABET + " ·") : null,
    ])
  ).filter((f) => f !== null);

  const serif = rtl ? "El Messiri, Cormorant Garamond" : "Cormorant Garamond";
  const script = rtl ? "El Messiri" : "Pinyon Script";
  const Line = ({ text, style }: { text: string; style: CSSProperties }) =>
    rtl ? <RtlLine text={text} style={style} /> : <div style={{ ...style, display: "flex" }}>{text}</div>;
  const italic = rtl ? ("normal" as const) : ("italic" as const);
  const label = {
    fontSize: rtl ? 26 : 20,
    letterSpacing: rtl ? 0 : 6,
    textTransform: "uppercase" as const,
    color: GOLD,
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: FOREST,
          padding: 36,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            background: IVORY,
            border: `2px solid ${GOLD}`,
            padding: 14,
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              border: `1px solid rgba(184,146,63,0.45)`,
              padding: "0 48px",
              gap: 56,
            }}
          >
            <div style={{ display: "flex", background: "#ffffff", padding: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} width={440} height={440} alt="" />
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                fontFamily: serif,
                color: FOREST,
              }}
            >
              <Line text={lines[0]} style={label} />
              <Line
                text={couple}
                style={{ fontFamily: script, fontSize: rtl ? 66 : 76, marginTop: 6 }}
              />
              <Line text={lines[1]} style={{ ...label, color: MUTED, fontSize: rtl ? 24 : 19 }} />
              <div style={{ width: 160, height: 1, background: GOLD, marginTop: 26, marginBottom: 26, display: "flex" }} />
              <Line text={lines[2]} style={{ fontSize: 30 }} />
              <Line text={lines[3]} style={{ fontSize: 26, fontStyle: italic, color: MUTED, marginTop: 14 }} />
              <Line text={lines[4]} style={{ fontSize: 28, marginTop: 14 }} />
              <Line text={lines[5]} style={{ fontSize: 22, color: MUTED, marginTop: 4 }} />
              <Line text={lines[6]} style={{ fontSize: 20, fontStyle: italic, color: MUTED, marginTop: 22 }} />
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=3600",
        // Netlify's CDN keeps the finished card, so repeat views (WhatsApp
        // previews, guests reopening it) don't re-render it.
        "Netlify-CDN-Cache-Control": "public, durable, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
