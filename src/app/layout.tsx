import type { Metadata } from "next";
import {
  Amiri,
  Aref_Ruqaa,
  Cormorant_Garamond,
  Pinyon_Script,
  Source_Sans_3,
} from "next/font/google";
import { content } from "@/lib/i18n";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const script = Pinyon_Script({
  variable: "--font-script",
  subsets: ["latin"],
  weight: "400",
});

const body = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Arabic pages: Amiri for text, Aref Ruqaa as the calligraphic counterpart
// of the script names.
const arabic = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

const arabicScript = Aref_Ruqaa({
  variable: "--font-arabic-script",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: content("en").meta.title,
  description: content("en").meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${script.variable} ${body.variable} ${arabic.variable} ${arabicScript.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-ink">
        {children}
      </body>
    </html>
  );
}
