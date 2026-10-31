import { AdminShortcut } from "@/components/AdminShortcut";
import { Details } from "@/components/Details";
import { Envelope } from "@/components/Envelope";
import { Hero } from "@/components/Hero";
import { RsvpForm } from "@/components/RsvpForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Story } from "@/components/Story";
import { Venue } from "@/components/Venue";
import { content, type Locale } from "@/lib/i18n";

// The whole invitation in one language; English at /, Arabic at /ar.
export function InvitePage({ locale }: { locale: Locale }) {
  const c = content(locale);

  return (
    <div lang={locale} dir={c.dir} className="flex min-h-full flex-col">
      <AdminShortcut />
      <Envelope locale={locale} />
      <SiteNav locale={locale} />
      <main>
        <Hero locale={locale} />
        <Story locale={locale} />
        <Details locale={locale} />
        <Venue locale={locale} />
        <RsvpForm locale={locale} />
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}
