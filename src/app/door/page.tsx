import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { DoorScanner } from "@/components/DoorScanner";
import { canCheckIn } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Door check-in",
  robots: { index: false },
  appleWebApp: { capable: true, title: "Door", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0d2219",
};

async function DoorGate() {
  const initiallyAuthed = await canCheckIn();
  return <DoorScanner initiallyAuthed={initiallyAuthed} />;
}

export default function DoorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-forest-deep text-ivory/70">
          Loading…
        </div>
      }
    >
      <DoorGate />
    </Suspense>
  );
}
