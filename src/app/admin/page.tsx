import { Suspense } from "react";
import { AdminDashboard } from "@/components/AdminDashboard";
import { isAdminAuthenticated } from "@/lib/auth";

type Props = { searchParams: Promise<{ google?: string }> };

async function AdminGate({ searchParams }: Props) {
  const initiallyAuthed = await isAdminAuthenticated();
  const { google } = await searchParams;
  return <AdminDashboard initiallyAuthed={initiallyAuthed} googleResult={google ?? null} />;
}

export default function AdminPage(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100svh] items-center justify-center bg-ivory text-muted">
          Loading dashboard…
        </div>
      }
    >
      <AdminGate {...props} />
    </Suspense>
  );
}
