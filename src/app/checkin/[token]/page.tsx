import { Suspense } from "react";
import Link from "next/link";
import { Ornament } from "@/components/Ornament";
import { canCheckIn } from "@/lib/auth";
import { getGuestByToken } from "@/lib/db";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ r?: string }>;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });
}

async function CheckInResult({ params, searchParams }: Props) {
  if (!(await canCheckIn())) {
    return (
      <Panel tone="neutral" title="Door sign-in required">
        <Link href="/door" className="btn-primary mt-8">
          Sign in
        </Link>
      </Panel>
    );
  }

  const { token } = await params;
  const { r } = await searchParams;
  const guest = token === "unknown" ? null : await getGuestByToken(token);

  if (!guest) {
    return (
      <Panel tone="bad" title="Not on the list">
        <p className="mt-4 text-ivory/80">
          This code doesn&apos;t match any guest. Please check with the hosts.
        </p>
      </Panel>
    );
  }

  const party = `${guest.guestCount} ${guest.guestCount === 1 ? "guest" : "guests"}`;

  if (r === "welcome") {
    return (
      <Panel tone="good" title="Welcome">
        <p className="script mt-4 text-6xl text-ivory">{guest.name}</p>
        <p className="mt-4 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
          {party} · checked in {guest.checkedInAt ? formatTime(guest.checkedInAt) : ""}
        </p>
      </Panel>
    );
  }

  return (
    <Panel tone="bad" title="Already used">
      <p className="script mt-4 text-5xl text-ivory">{guest.name}</p>
      <p className="mt-4 text-ivory/80">
        This pass was already scanned
        {guest.checkedInAt ? ` at ${formatTime(guest.checkedInAt)}` : ""}.
      </p>
      <p className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
        {party}
      </p>
    </Panel>
  );
}

function Panel({
  tone,
  title,
  children,
}: {
  tone: "good" | "bad" | "neutral";
  title: string;
  children: React.ReactNode;
}) {
  const bg =
    tone === "good" ? "bg-forest" : tone === "bad" ? "bg-[#5a1f1f]" : "bg-forest-deep";
  return (
    <div className={`flex min-h-[100svh] flex-col items-center justify-center px-6 text-center text-ivory ${bg}`}>
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-gold-soft">
        Door check-in
      </p>
      <h1 className="display mt-4 text-5xl">{title}</h1>
      <Ornament className="mx-auto mt-5" />
      {children}
      <Link
        href="/door"
        className="mt-12 text-sm text-ivory/70 underline-offset-4 hover:underline"
      >
        Open door scanner
      </Link>
    </div>
  );
}

export default function CheckInPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-forest-deep text-ivory/70">
          Checking pass…
        </div>
      }
    >
      <CheckInResult {...props} />
    </Suspense>
  );
}
