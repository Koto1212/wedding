"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Guest, RsvpStatus } from "@/lib/types";
import { wedding } from "@/lib/wedding";
import { WhatsappSendDialog } from "@/components/WhatsappSendDialog";

type Summary = {
  total: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
  headcount: number;
  arrived: number;
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });
}

type Props = {
  initiallyAuthed: boolean;
  googleResult: string | null;
};

type GoogleStatus = { available: boolean; email: string | null };

const GOOGLE_MESSAGES: Record<string, string> = {
  connected: "Google account connected — entry passes will be sent from it.",
  cancelled: "Google sign-in was cancelled.",
  "no-send-permission":
    "Google sign-in worked, but “Send email on your behalf” wasn't allowed. Please try again and tick it.",
  "not-configured": "Google sign-in isn't set up yet (see the steps below).",
  error: "Google sign-in didn't complete. Please try again.",
};

// Guest rows as the API returns them, with a ready-to-send WhatsApp link.
type DashGuest = Guest & { whatsappLink: string | null };

const emptyGuest = {
  name: "",
  email: "",
  phone: "",
  status: "pending" as RsvpStatus,
  guestCount: 1,
  message: "",
};

export function AdminDashboard({ initiallyAuthed, googleResult }: Props) {
  const [authed, setAuthed] = useState(initiallyAuthed);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [guests, setGuests] = useState<DashGuest[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(initiallyAuthed);
  const [form, setForm] = useState(emptyGuest);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mailConfigured, setMailConfigured] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [google, setGoogle] = useState<GoogleStatus | null>(null);
  const [whatsappFor, setWhatsappFor] = useState<DashGuest | null>(null);
  const [googleNote, setGoogleNote] = useState<string | null>(
    googleResult ? GOOGLE_MESSAGES[googleResult] ?? null : null,
  );

  const loadGuests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/guests");
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = (await res.json()) as {
        guests: DashGuest[];
        summary: Summary;
        mailConfigured: boolean;
        google: GoogleStatus;
      };
      setGuests(data.guests);
      setSummary(data.summary);
      setMailConfigured(data.mailConfigured);
      setGoogle(data.google);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      void loadGuests();
    }
  }, [authed, loadGuests]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setLoginError(data.error || "Login failed.");
      return;
    }
    setPassword("");
    setAuthed(true);
  }

  async function sendPass(id: string) {
    setSendingId(id);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/guests/send-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = (await res.json()) as { error?: string };
      setMessage(res.ok ? "Entry pass sent." : data.error || "Could not send the pass.");
      await loadGuests();
    } finally {
      setSendingId(null);
    }
  }

  async function disconnectGoogle() {
    if (!confirm("Stop sending entry passes from this Google account?")) return;
    await fetch("/api/admin/google/disconnect", { method: "POST" });
    setGoogleNote("Google account disconnected.");
    await loadGuests();
  }

  // We can't see whether the WhatsApp message was actually sent, so this
  // just records that the host shared or opened it.
  async function markWhatsapp(id: string) {
    await fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, whatsappSent: true }),
    });
    await loadGuests();
  }

  async function setArrived(id: string, checkedIn: boolean) {
    await fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, checkedIn }),
    });
    await loadGuests();
  }

  async function onLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setGuests([]);
    setSummary(null);
  }

  async function onAddGuest(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Could not add guest.");
      }
      setForm(emptyGuest);
      setMessage("Guest added.");
      await loadGuests();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error adding guest.");
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: RsvpStatus) {
    await fetch("/api/admin/guests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await loadGuests();
  }

  async function removeGuest(id: string) {
    if (!confirm("Remove this guest?")) return;
    await fetch(`/api/admin/guests?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    await loadGuests();
  }

  if (!authed) {
    return (
      <div className="mx-auto flex min-h-[100svh] max-w-md flex-col justify-center px-5 py-16">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-gold">
          Host access
        </p>
        <h1 className="display mt-3 text-5xl text-forest">Admin</h1>
        <p className="mt-3 text-muted">
          Sign in to manage RSVPs for {wedding.partnerOne} & {wedding.partnerTwo}.
        </p>
        <form onSubmit={onLogin} className="mt-10 space-y-4">
          <label className="block space-y-2">
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
              Password
            </span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {loginError ? (
            <p className="text-sm font-medium text-red-800">{loginError}</p>
          ) : null}
          <button type="submit" className="btn-primary w-full">
            Enter dashboard
          </button>
        </form>
        <a href="/" className="mt-8 text-sm text-muted underline-offset-4 hover:underline">
          Back to invitation
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-[100svh] bg-ivory-soft">
      <header className="border-b border-line bg-ivory px-5 py-5 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-gold">
              {wedding.monogram}
            </p>
            <h1 className="display text-3xl text-forest md:text-4xl">
              Guest dashboard
            </h1>
          </div>
          <div className="flex gap-3">
            <a href="/" className="btn-primary !bg-transparent !px-4 !py-2 !text-forest border border-line">
              View invite
            </a>
            <button type="button" className="btn-primary !px-4 !py-2" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 md:px-8">
        {summary ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            {[
              { label: "Arrived", value: summary.arrived },
              { label: "Attending", value: summary.attending },
              { label: "Headcount", value: summary.headcount },
              { label: "Declined", value: summary.declined },
              { label: "Maybe", value: summary.maybe },
              { label: "Pending", value: summary.pending },
            ].map((stat) => (
              <div key={stat.label} className="border border-line bg-ivory p-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted">
                  {stat.label}
                </p>
                <p className="display mt-2 text-4xl text-forest">{stat.value}</p>
              </div>
            ))}
          </div>
        ) : null}

        <section className="mt-6 border border-line bg-ivory p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="display text-2xl text-forest">Entry-pass emails</h2>
              <p className="mt-1 text-sm text-muted">
                {!google
                  ? "Checking…"
                  : google.email
                    ? `Sending from ${google.email}`
                    : mailConfigured
                      ? "Sending with the Gmail app password from .env.local"
                      : "Off — guests won't receive their QR code until you connect an account."}
              </p>
            </div>
            {google?.email ? (
              <button
                type="button"
                className="text-sm font-semibold text-red-800 hover:underline"
                onClick={() => void disconnectGoogle()}
              >
                Disconnect
              </button>
            ) : google?.available ? (
              <a
                href="/api/admin/google/connect"
                className="inline-flex items-center gap-3 border border-line bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-gold"
              >
                <svg aria-hidden viewBox="0 0 48 48" className="h-5 w-5">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.6 17.8 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17z" />
                  <path fill="#FBBC05" d="M10.6 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.9-6.2C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.2z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.2C6.6 42.6 14.6 48 24 48z" />
                </svg>
                Sign in with Google
              </a>
            ) : null}
          </div>
          {googleNote ? (
            <p className="mt-4 text-sm font-medium text-forest">{googleNote}</p>
          ) : null}
          {google && !google.available && !mailConfigured ? (
            <p className="mt-4 text-sm text-muted">
              To enable “Sign in with Google”, add <code>GOOGLE_CLIENT_ID</code> and{" "}
              <code>GOOGLE_CLIENT_SECRET</code> to <code>.env.local</code> and restart
              the server.
            </p>
          ) : null}
        </section>

        <section className="mt-10 border border-line bg-ivory p-6">
          <h2 className="display text-3xl text-forest">Add guest</h2>
          <form
            onSubmit={onAddGuest}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <label className="space-y-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Name
              </span>
              <input
                className="field"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Email
              </span>
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                WhatsApp number
              </span>
              <input
                className="field"
                type="tel"
                placeholder="079 123 4567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label className="space-y-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Status
              </span>
              <select
                className="field"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as RsvpStatus })
                }
              >
                <option value="pending">Pending</option>
                <option value="attending">Attending</option>
                <option value="declined">Declined</option>
                <option value="maybe">Maybe</option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-muted">
                Guest count
              </span>
              <input
                className="field"
                type="number"
                min={1}
                max={10}
                value={form.guestCount}
                onChange={(e) =>
                  setForm({ ...form, guestCount: Number(e.target.value) || 1 })
                }
              />
            </label>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Add guest"}
              </button>
              {message ? (
                <p className="mt-3 text-sm text-muted">{message}</p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="display text-3xl text-forest">Responses</h2>
            <button
              type="button"
              className="text-sm font-semibold uppercase tracking-[0.14em] text-muted hover:text-forest"
              onClick={() => void loadGuests()}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-muted">Loading guests…</p>
          ) : guests.length === 0 ? (
            <p className="border border-line bg-ivory p-8 text-muted">
              No RSVPs yet. Share the invitation link with your guests.
            </p>
          ) : (
            <div className="overflow-x-auto border border-line bg-ivory">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-line bg-forest text-ivory">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Guests</th>
                    <th className="px-4 py-3 font-semibold">Arrival</th>
                    <th className="px-4 py-3 font-semibold">Entry pass</th>
                    <th className="px-4 py-3 font-semibold">WhatsApp</th>
                    <th className="px-4 py-3 font-semibold">Message</th>
                    <th className="px-4 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((guest) => (
                    <tr key={guest.id} className="border-b border-line align-top">
                      <td className="px-4 py-3 font-medium text-forest">
                        {guest.name}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {guest.email}
                        {guest.phone ? (
                          <span className="block whitespace-nowrap text-xs">{guest.phone}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="field min-w-[8.5rem] !py-2"
                          value={guest.status}
                          onChange={(e) =>
                            void updateStatus(
                              guest.id,
                              e.target.value as RsvpStatus,
                            )
                          }
                        >
                          <option value="pending">Pending</option>
                          <option value="attending">Attending</option>
                          <option value="declined">Declined</option>
                          <option value="maybe">Maybe</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">{guest.guestCount}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {guest.checkedInAt ? (
                          <>
                            <span className="font-semibold text-forest">
                              Arrived {formatTime(guest.checkedInAt)}
                            </span>
                            <button
                              type="button"
                              className="ml-2 text-xs text-muted hover:underline"
                              onClick={() => void setArrived(guest.id, false)}
                            >
                              Undo
                            </button>
                          </>
                        ) : (
                          <>
                            <span className="text-muted">Not yet</span>
                            <button
                              type="button"
                              className="ml-2 text-xs font-semibold text-forest hover:underline"
                              onClick={() => void setArrived(guest.id, true)}
                            >
                              Mark arrived
                            </button>
                          </>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {guest.status === "attending" &&
                        guest.email &&
                        guest.email !== "unlisted@local" ? (
                          <>
                            <span className="text-muted">
                              {guest.qrSentAt ? "Sent" : "Not sent"}
                            </span>
                            <button
                              type="button"
                              className="ml-2 text-xs font-semibold text-forest hover:underline disabled:opacity-50"
                              disabled={!mailConfigured || sendingId === guest.id}
                              onClick={() => void sendPass(guest.id)}
                            >
                              {sendingId === guest.id
                                ? "Sending…"
                                : guest.qrSentAt
                                  ? "Resend"
                                  : "Send"}
                            </button>
                          </>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {guest.whatsappLink ? (
                          <button
                            type="button"
                            onClick={() => setWhatsappFor(guest)}
                            className="inline-flex items-center gap-1.5 bg-[#1f7a4d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#186640]"
                          >
                            <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3.9 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.4-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z" />
                            </svg>
                            {guest.whatsappSentAt ? "Send again" : "Send"}
                          </button>
                        ) : (
                          <span className="text-muted">
                            {guest.status === "attending" && !guest.phone ? "No number" : "—"}
                          </span>
                        )}
                      </td>
                      <td className="max-w-xs px-4 py-3 text-muted">
                        {guest.message || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-sm font-semibold text-red-800 hover:underline"
                          onClick={() => void removeGuest(guest.id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {whatsappFor?.whatsappLink ? (
        <WhatsappSendDialog
          guestName={whatsappFor.name}
          phone={whatsappFor.phone}
          whatsappLink={whatsappFor.whatsappLink}
          cardUrl={`/pass/${encodeURIComponent(whatsappFor.checkInToken)}/card.png`}
          onOpened={() => void markWhatsapp(whatsappFor.id)}
          onClose={() => setWhatsappFor(null)}
        />
      ) : null}
    </div>
  );
}
