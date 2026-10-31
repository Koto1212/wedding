"use client";

import { FormEvent, useState } from "react";
import { Corner, Ornament } from "@/components/Ornament";
import { SectionHeading } from "@/components/SectionHeading";
import { content, type Locale } from "@/lib/i18n";
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

// Guests give one way to reach them: an email or a WhatsApp number.
type Contact = "email" | "whatsapp";

const labelClass =
  "text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted";

export function RsvpForm({ locale }: { locale: Locale }) {
  const c = content(locale);
  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [passPath, setPassPath] = useState<string | null>(null);
  const [contact, setContact] = useState<Contact>("email");
  const [sentVia, setSentVia] = useState<Contact>("email");

  const choices: { value: RsvpStatus; label: string }[] = [
    { value: "attending", label: c.rsvp.accept },
    { value: "declined", label: c.rsvp.decline },
  ];

  const contacts: { value: Contact; label: string }[] = [
    { value: "email", label: c.rsvp.email },
    { value: "whatsapp", label: c.rsvp.whatsapp },
  ];

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
          locale,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        emailSent?: boolean;
        passPath?: string | null;
      };
      if (!res.ok) {
        throw new Error(data.error || c.rsvp.errors.server);
      }
      setEmailSent(Boolean(data.emailSent));
      setPassPath(data.passPath ?? null);
      setSentVia(contact);
      setDone(true);
      setForm(initial);
    } catch (err) {
      setError(err instanceof Error ? err.message : c.rsvp.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="rsvp" className="section-pad bg-ivory">
      <div className="mx-auto max-w-2xl">
        <SectionHeading eyebrow={c.rsvp.eyebrow} title={c.rsvp.title} />

        {/* The reply card */}
        <div className="relative mt-14 bg-ivory-soft px-6 py-12 shadow-[0_30px_60px_-35px_rgba(13,34,25,0.45)] sm:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-3 border border-gold/50" />
          <Corner className="left-5 top-5" />
          <Corner className="right-5 top-5 rotate-90" />
          <Corner className="bottom-5 right-5 rotate-180" />
          <Corner className="bottom-5 left-5 -rotate-90" />

          {done ? (
            <div className="animate-rise relative py-8 text-center">
              <p className="script text-6xl text-forest">{c.rsvp.thanks}</p>
              <Ornament className="mx-auto mt-5" />
              <p className="display mx-auto mt-6 max-w-sm text-xl italic leading-relaxed text-muted">
                {c.rsvp.received}
              </p>
              {emailSent ? (
                <p className="mx-auto mt-4 max-w-sm text-sm text-forest">{c.rsvp.emailSent}</p>
              ) : passPath && sentVia === "whatsapp" ? (
                <p className="mx-auto mt-4 max-w-sm text-sm text-forest">{c.rsvp.whatsappSoon}</p>
              ) : null}
              {passPath ? (
                <a href={passPath} target="_blank" rel="noopener noreferrer" className="btn-primary mt-6">
                  {c.rsvp.viewPass}
                </a>
              ) : null}
              <br />
              <button
                type="button"
                className="mt-6 text-sm font-semibold uppercase tracking-[0.14em] text-muted hover:text-forest"
                onClick={() => setDone(false)}
              >
                {c.rsvp.another}
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="relative space-y-8">
              <label className="block">
                <span className={labelClass}>{c.rsvp.name}</span>
                <input
                  className="line-field display text-2xl"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoComplete="name"
                />
              </label>

              <fieldset>
                <legend className={`${labelClass} mb-3`}>{c.rsvp.attend}</legend>
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
                  <span className={labelClass}>{c.rsvp.sendBy}</span>
                  <div role="radiogroup" className="inline-flex border border-gold/60 p-0.5">
                    {contacts.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="radio"
                        aria-checked={contact === option.value}
                        onClick={() => setContact(option.value)}
                        className={`px-4 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.18em] transition-colors ${
                          contact === option.value
                            ? "bg-forest text-ivory"
                            : "text-forest hover:bg-gold/10"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Emails and phone numbers always read left to right. */}
                {contact === "email" ? (
                  <input
                    key="email"
                    className="line-field mt-3"
                    type="email"
                    dir="ltr"
                    required
                    aria-label={c.rsvp.email}
                    placeholder={c.rsvp.emailPlaceholder}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                  />
                ) : (
                  <input
                    key="whatsapp"
                    className="line-field mt-3"
                    type="tel"
                    dir="ltr"
                    inputMode="tel"
                    required
                    aria-label={c.rsvp.whatsapp}
                    placeholder={c.rsvp.phonePlaceholder}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    autoComplete="tel"
                  />
                )}
              </div>

              <label className="block">
                <span className={labelClass}>{c.rsvp.note}</span>
                <textarea
                  className="line-field min-h-24 resize-y"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder={c.rsvp.notePlaceholder}
                />
              </label>

              {error ? (
                <p className="text-sm font-medium text-red-800" role="alert">
                  {error}
                </p>
              ) : null}

              <div className="pt-2 text-center">
                <button type="submit" className="btn-primary min-w-48" disabled={submitting}>
                  {submitting ? c.rsvp.sending : c.rsvp.submit}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
