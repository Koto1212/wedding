import { AdminShortcut } from "@/components/AdminShortcut";
import { Details } from "@/components/Details";
import { Envelope } from "@/components/Envelope";
import { Hero } from "@/components/Hero";
import { RsvpForm } from "@/components/RsvpForm";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Story } from "@/components/Story";
import { Venue } from "@/components/Venue";

export default function Home() {
  return (
    <>
      <AdminShortcut />
      <Envelope />
      <SiteNav />
      <main>
        <Hero />
        <Story />
        <Details />
        <Venue />
        <RsvpForm />
      </main>
      <SiteFooter />
    </>
  );
}
