"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Hidden host shortcut: Ctrl+P (Cmd+P on Mac) on the invitation opens the
// RSVP dashboard instead of the browser's print dialog.
export function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        (event.ctrlKey || event.metaKey) &&
        !event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === "p"
      ) {
        event.preventDefault();
        router.push("/admin");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
