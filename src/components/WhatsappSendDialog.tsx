"use client";

import { useEffect, useState } from "react";

type Props = {
  guestName: string;
  phone: string;
  // wa.me link with the message pre-filled
  whatsappLink: string;
  cardUrl: string;
  onOpened: () => void;
  onClose: () => void;
};

type Status = { tone: "ok" | "error"; text: string } | null;

// WhatsApp links can only carry text, so the card image is handed over
// separately: through the phone's share sheet, or the clipboard on a computer.
export function WhatsappSendDialog({
  guestName,
  phone,
  whatsappLink,
  cardUrl,
  onOpened,
  onClose,
}: Props) {
  const [card, setCard] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [copied, setCopied] = useState(false);
  const message = new URL(whatsappLink).searchParams.get("text") ?? "";

  // Fetch the card up front: the phone share sheet must open straight from
  // the tap, with no download in between.
  useEffect(() => {
    let cancelled = false;
    fetch(cardUrl)
      .then((res) => (res.ok ? res.blob() : Promise.reject(new Error("card"))))
      .then((blob) => {
        if (!cancelled) setCard(new File([blob], "entry-pass.png", { type: "image/png" }));
      })
      .catch(() => {
        if (!cancelled) setStatus({ tone: "error", text: "Couldn't load the card image." });
      });
    return () => {
      cancelled = true;
    };
  }, [cardUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canShareFile =
    card !== null &&
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [card] });

  async function shareCard() {
    if (!card) return;
    try {
      await navigator.share({ files: [card], text: message });
      onOpened();
      setStatus({ tone: "ok", text: "Shared. Make sure you picked " + guestName + " in WhatsApp." });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setStatus({ tone: "error", text: "Sharing didn't work here — use Copy card instead." });
    }
  }

  async function copyCard() {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": card ?? fetch(cardUrl).then((r) => r.blob()) }),
      ]);
      setCopied(true);
      setStatus({ tone: "ok", text: "Card copied. Now open the chat and press Ctrl+V (⌘V on Mac) to attach it." });
    } catch {
      setStatus({
        tone: "error",
        text: "This browser can't copy images. Right-click the card above → Copy image, then open the chat.",
      });
    }
  }

  function openChat() {
    window.open(whatsappLink, "_blank", "noopener,noreferrer");
    onOpened();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Send entry pass to ${guestName} on WhatsApp`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[92svh] w-full max-w-lg overflow-y-auto bg-ivory p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold">
              WhatsApp
            </p>
            <h2 className="display mt-1 text-3xl text-forest">{guestName}</h2>
            <p className="text-sm text-muted">{phone}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="text-2xl leading-none text-muted hover:text-forest"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardUrl}
          alt="Entry pass card"
          className="mt-5 w-full border border-line"
        />

        {canShareFile ? (
          <div className="mt-6">
            <button type="button" className="btn-primary w-full !bg-[#1f7a4d] hover:!bg-[#186640]" onClick={() => void shareCard()}>
              Share card to WhatsApp
            </button>
            <p className="mt-2 text-xs text-muted">
              Choose WhatsApp, then {guestName}. The card and message are sent together.
            </p>
          </div>
        ) : null}

        <div className={canShareFile ? "mt-6 border-t border-line pt-5" : "mt-6"}>
          {canShareFile ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Or on a computer
            </p>
          ) : null}
          <ol className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold text-xs text-forest">1</span>
              <button type="button" className="btn-primary flex-1 !py-3" onClick={() => void copyCard()}>
                {copied ? "Card copied ✓" : "Copy card"}
              </button>
            </li>
            <li className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold text-xs text-forest">2</span>
              <button type="button" className="btn-primary flex-1 !bg-[#1f7a4d] !py-3 hover:!bg-[#186640]" onClick={openChat}>
                Open chat with message
              </button>
            </li>
            <li className="flex items-center gap-3 text-sm text-muted">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold text-xs text-forest">3</span>
              In WhatsApp, press Ctrl+V to attach the card, then send.
            </li>
          </ol>
        </div>

        {status ? (
          <p
            role="status"
            className={`mt-5 text-sm ${status.tone === "ok" ? "text-forest" : "text-red-800"}`}
          >
            {status.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
