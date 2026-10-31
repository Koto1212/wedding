import type { Metadata } from "next";
import { InvitePage } from "@/components/InvitePage";
import { content } from "@/lib/i18n";

const c = content("ar");

export const metadata: Metadata = {
  title: c.meta.title,
  description: c.meta.description,
};

export default function ArabicHome() {
  return <InvitePage locale="ar" />;
}
