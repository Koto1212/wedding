import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { checkInUrl } from "./mailer";
import type { Guest } from "./types";
import { wedding } from "./wedding";

// Landscape so WhatsApp shows it as a large link preview.
export const CARD_SIZE = { width: 1200, height: 630 };

const FOREST = "#163428";
const FOREST_DEEP = "#0d2219";
const IVORY = "#faf7f1";
const GOLD = "#b8923f";
const MUTED = "#5c6b62";

// Fetches a Google font as TTF, subset to the text we draw. If it can't be
// loaded the card still renders in the built-in font.
async function loadFont(family: string, text: string, italic = false) {
  try {
    const spec = italic ? ":ital@1" : "";
    const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}${spec}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!src) return null;
    const data = await (await fetch(src)).arrayBuffer();
    return { name: family, data, style: italic ? ("italic" as const) : ("normal" as const), weight: 400 as const };
  } catch {
    return null;
  }
}

export async function renderPassCard(guest: Guest): Promise<ImageResponse> {
  const qr = await QRCode.toDataURL(checkInUrl(guest), {
    width: 460,
    margin: 1,
    color: { dark: FOREST_DEEP, light: "#ffffff" },
  });

  const couple = `${wedding.partnerOne} & ${wedding.partnerTwo}`;
  const party = guest.guestCount > 1 ? `Admits ${guest.guestCount} guests` : "Admits 1 guest";
  const lines = [
    "Entry pass",
    wedding.dateDisplay,
    `${guest.name} · ${party}`,
    wedding.timeDisplay,
    wedding.venue.name,
    wedding.venue.address,
    "Please show this at the door · Works once",
  ];

  const fonts = (
    await Promise.all([
      loadFont("Pinyon Script", couple),
      // Labels are drawn uppercase, so the font subset needs those letters too.
      loadFont("Cormorant Garamond", lines.join(" ") + lines.join(" ").toUpperCase()),
      loadFont("Cormorant Garamond", wedding.timeDisplay + lines[6], true),
    ])
  ).filter((f) => f !== null);

  const serif = "Cormorant Garamond";
  const label = {
    fontSize: 20,
    letterSpacing: 6,
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
              <div style={{ ...label, display: "flex" }}>{lines[0]}</div>
              <div style={{ fontFamily: "Pinyon Script", fontSize: 76, marginTop: 6, display: "flex" }}>
                {couple}
              </div>
              <div style={{ ...label, color: MUTED, fontSize: 19, display: "flex" }}>{lines[1]}</div>
              <div style={{ width: 160, height: 1, background: GOLD, marginTop: 26, marginBottom: 26, display: "flex" }} />
              <div style={{ fontSize: 30, display: "flex" }}>{lines[2]}</div>
              <div style={{ fontSize: 26, fontStyle: "italic", color: MUTED, marginTop: 14, display: "flex" }}>
                {lines[3]}
              </div>
              <div style={{ fontSize: 28, marginTop: 14, display: "flex" }}>{lines[4]}</div>
              <div style={{ fontSize: 22, color: MUTED, marginTop: 4, display: "flex" }}>{lines[5]}</div>
              <div style={{ fontSize: 20, fontStyle: "italic", color: MUTED, marginTop: 22, display: "flex" }}>
                {lines[6]}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...CARD_SIZE,
      fonts,
      headers: { "Cache-Control": "public, max-age=3600" },
    },
  );
}
