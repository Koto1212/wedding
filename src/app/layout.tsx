import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script, Source_Sans_3 } from "next/font/google";
import { wedding } from "@/lib/wedding";
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

export const metadata: Metadata = {
  title: `${wedding.partnerOne} & ${wedding.partnerTwo} — Wedding Invitation`,
  description: `You're invited to celebrate ${wedding.partnerOne} and ${wedding.partnerTwo} on ${wedding.dateDisplay}.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${script.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ivory text-ink">
        {children}
      </body>
    </html>
  );
}
