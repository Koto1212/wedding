"use client";

import Link from "next/link";
import { useEffect } from "react";
import { FallbackPage } from "@/components/FallbackPage";

// Shown instead of a blank screen if a page crashes.
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <FallbackPage
      en={{
        title: "Something went wrong",
        body: "Please try again in a moment. Your RSVP and pass are safe.",
      }}
      ar={{
        title: "حدث خطأ ما",
        body: "يُرجى المحاولة بعد قليل. ردّكم وبطاقة دخولكم محفوظان.",
      }}
    >
      <button type="button" className="btn-primary bg-gold text-forest-deep hover:bg-gold-soft" onClick={() => retry()}>
        Try again · حاول مجدداً
      </button>
      <Link href="/" className="btn-ghost">
        Invitation · الدعوة
      </Link>
    </FallbackPage>
  );
}
