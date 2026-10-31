"use client";

import { FormEvent, useState } from "react";
import { Corner, Ornament } from "@/components/Ornament";
import { SectionHeading } from "@/components/SectionHeading";
import { wedding } from "@/lib/wedding";
import type { RsvpStatus } from "@/lib/types";

type FormState = {
  name: string;
  email: string;
  phone: string;
  status: RsvpStatus;
  guestCount: number;
  message: string;
};

const initial: FormState = {
  name: "",
  email: "",
  phone: "",
  status: "attending",
  guestCount: 1,
  message: "",
};

const choices: { value: RsvpStatus; label: string }[] = [
  { value: "attending", label: "Joyfully accepts" },
  { value: "declined", label: "Regretfully declines" },
];

// Guests give one way to reach them: an email or a WhatsApp number.
type Contact = "email" | "whatsapp";

const contacts: { value: Contact; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
];

const labelClass =
  "text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted";

export function RsvpForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passPath, setPassPath] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>("email");
  const [sentVia, setSentVia] = useState<Contact>("email");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: contact === "email" ? form.email : "",
          phone: contact === "whatsapp" ? form.phone : "",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        passPath?: string | null;
      };
      if (!res.ok) {
        throw new Error(data.error || "Unable to save your RSVP.");
      }
      setEmailSent(Boolean(data.emailSent));
      setPassPath(data.passPath ?? null);
      setSentVia(contact);
      setDone(true);
      setForm(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="section-pad bg-ivory">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow={`Please respond by ${wedding.rsvpDeadline}`} title="Kindly reply" />

        {/* The reply card */}
        <div className="relative mt-14 bg-ivory-soft px-6 py-12 shadow-[0_30px_60px_-35px_rgba(13,34,25,0.45)] sm:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-3 border border-gold/50" />
          <Corner className="left-5 top-5" />
          <Corner className="right-5 top-5 rotate-90" />
          <Corner className="bottom-5 right-5 rotate-180" />
          <Corner className="bottom-5 left-5 -rotate-90" />

          {done ? (
            <div className="animate-rise relative py-8 text-center">
              <p className="script text-6xl text-forest">Thank you</p>
              <Ornament className="mx-auto mt-5" />
              <p className="display mx-auto mt-6 max-w-sm text-xl italic leading-relaxed text-muted">
                Your reply has been received. We cannot wait to see you — or to
                miss you kindly if you cannot make it.
              </p>
              {emailSent ? (
                <p className="mx-auto mt-4 max-w-sm text-sm text-forest">
                  Your personal entry pass is on its way to your inbox — please
                  bring it on the day.
                </p>
              ) : passPath && sentVia === "whatsapp" ? (
                <p className="mx-auto mt-4 max-w-sm text-sm text-forest">
                  We&apos;ll send your personal entry pass to your WhatsApp —
                  you can also open it below.
                </p>
              ) : null}
              {passPath ? (
                <a href={passPath} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
                  View my entry pass
                </a>
              ) : null}
              <br />
              <button
                type="button"
                className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted hover:text-forest"
                onClick={() => setDone(false)}
              >
                Reply for another guest
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative space-y-8">
              <label className="block">
                <span className={labelClass}>Name(s)</span>
                <input
                  className="line-field display text-2xl"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </label>

              <fieldset>
                <legend className={`${labelClass} mb-3`}>Will you attend?</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {choices.map((choice) => {
                    const selected = form.status === choice.value;
                    return (
                      <label
                        key={choice.value}
                        className={`flex cursor-pointer items-center gap-3 border px-4 py-3 transition-colors ${
                          selected
                            ? "border-forest bg-forest text-ivory"
                            : "border-line text-forest hover:border-gold"
                        }`}
                      >
                        <input
                          type="radio"
                          name="status"
                          value={choice.value}
                          checked={selected}
                          onChange={() => setForm({ ...form, status: choice.value })}
                          className="sr-only"
                        />
                        <span
                          aria-hidden
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected ? "border-gold-soft" : "border-gold"
                          }`}
                        >
                          {selected ? <span className="h-2 w-2 rounded-full bg-gold-soft" /> : null}
                        </span>
                        <span className="display text-lg italic leading-tight">
                          {choice.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className={labelClass}>Send my entry pass by</span>
                  <div role="radiogroup" className="inline-flex border border-gold/60 p-0.5">
                    {contacts.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        role="radio"
                        aria-checked={contact === c.value}
                        onClick={() => setContact(c.value)}
                        className={`px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
                          contact === c.value
                            ? "bg-forest text-ivory"
                            : "text-forest hover:bg-gold/10"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
                {contact === "email" ? (
                  <input
                    key="email"
                    className="line-field mt-3"
                    type="email"
                    required
                    aria-label="Email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                ) : (
                  <input
                    key="whatsapp"
                    className="line-field mt-3"
                    type="tel"
                    inputMode="tel"
                    required
                    aria-label="WhatsApp number"
                    placeholder="079 123 4567"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                  />
                )}
              </div>


              <label className="block">
                <span className={labelClass}>A note for the couple</span>
                <textarea
                  className="line-field min-h-24 resize-y"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Song requests, dietary notes, well wishes…"
                />
              </label>

              {error ? (
                <p className="text-sm font-medium text-red-800" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="pt-2 text-center">
                <button type="submit" className="btn-primary min-w-48" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reply"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
