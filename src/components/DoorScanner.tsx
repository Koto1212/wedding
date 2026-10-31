"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { wedding } from "@/lib/wedding";

type Stats = { arrived: number; expected: number };

type ScanResult =
  | { result: "welcome" | "already"; name: string; guestCount: number; checkedInAt: string | null }
  | { result: "notfound" }
  | { result: "error"; message: string };

const RESULT_MS = 2600; // how long the green/red screen stays up
const SAME_CODE_MS = 6000; // ignore the same pass held in front of the camera

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Amman",
  });
}

function fetchStats(): Promise<Stats | null> {
  return fetch("/api/door/stats")
    .then((res) => (res.ok ? (res.json() as Promise<Stats>) : null))
    .catch(() => null);
}

export function DoorScanner({ initiallyAuthed }: { initiallyAuthed: boolean }) {
  const [authed, setAuthed] = useState(initiallyAuthed);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [shown, setShown] = useState<ScanResult | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const busyRef = useRef(false);
  const lastCodeRef = useRef<{ code: string; at: number } | null>(null);

  // Keep the head count fresh while signed in (other phones may be scanning too).
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    const refresh = () =>
      fetchStats().then((s) => {
        if (!cancelled && s) setStats(s);
      });
    refresh();
    const id = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [authed]);

  const stopCamera = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function handleCode(code: string) {
    const now = Date.now();
    const last = lastCodeRef.current;
    if (last && last.code === code && now - last.at < SAME_CODE_MS) return;
    lastCodeRef.current = { code, at: now };
    busyRef.current = true;

    let result: ScanResult;
    try {
      const res = await fetch("/api/door/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (res.status === 401) {
        stopCamera();
        setAuthed(false);
        busyRef.current = false;
        return;
      }
      const data = (await res.json()) as ScanResult & { error?: string };
      result = res.ok ? data : { result: "error", message: data.error || "Could not check this pass." };
    } catch {
      result = { result: "error", message: "No connection — try again." };
    }

    setShown(result);
    if (navigator.vibrate) {
      navigator.vibrate(result.result === "welcome" ? 120 : [80, 60, 80, 60, 80]);
    }
    fetchStats().then((s) => s && setStats(s));

    setTimeout(() => {
      setShown(null);
      busyRef.current = false;
    }, RESULT_MS);
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !streamRef.current) return;

    if (!busyRef.current && video.readyState >= video.HAVE_ENOUGH_DATA) {
      // Decode a downscaled frame; plenty for a phone-screen QR and much faster.
      const scale = Math.min(1, 640 / video.videoWidth);
      const w = Math.round(video.videoWidth * scale);
      const h = Math.round(video.videoHeight * scale);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const found = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {
          inversionAttempts: "dontInvert",
        });
        if (found?.data) void handleCode(found.data);
      }
    }
    frameRef.current = requestAnimationFrame(scanFrame);
  }

  async function startCamera() {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        "This browser can't use the camera here. The site must be opened over https:// (or on this computer as localhost).",
      );
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
      frameRef.current = requestAnimationFrame(scanFrame);
    } catch (err) {
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setCameraError(
        denied
          ? "Camera access was blocked. Allow the camera for this site in your browser settings, then try again."
          : "Couldn't start the camera. Close other apps using it and try again.",
      );
    }
  }

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setLoginError(null);
    const res = await fetch("/api/door/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      setLoginError(data.error || "Sign-in failed.");
      return;
    }
    setPassword("");

    // Signed in after scanning a pass with the phone camera: finish that check-in.
    const next = new URLSearchParams(window.location.search).get("next");
    if (next && next.startsWith("/api/checkin/")) {
      window.location.assign(next);
      return;
    }
    setAuthed(true);
  }

  async function onLogout() {
    stopCamera();
    await fetch("/api/door/logout", { method: "POST" });
    setAuthed(false);
    setStats(null);
  }

  if (!authed) {
    return (
      <div className="flex min-h-[100svh] flex-col justify-center bg-forest-deep px-6 py-16 text-ivory">
        <div className="mx-auto w-full max-w-sm">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            {wedding.monogram} · Door
          </p>
          <h1 className="display mt-3 text-5xl">Guest check-in</h1>
          <p className="mt-3 text-ivory/70">Enter the door password to start scanning passes.</p>
          <form onSubmit={onLogin} className="mt-10 space-y-4">
            <input
              className="field"
              type="password"
              placeholder="Door password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            {loginError ? (
              <p className="text-sm font-medium text-red-300">{loginError}</p>
            ) : null}
            <button type="submit" className="btn-primary w-full bg-gold text-forest-deep hover:bg-gold-soft">
              Start check-in
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[100svh] flex-col bg-forest-deep text-ivory">
      <header className="flex items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            {wedding.monogram} · Door
          </p>
          <p className="display mt-1 text-2xl">
            {stats ? (
              <>
                {stats.arrived}
                <span className="text-ivory/50"> / {stats.expected}</span>
                <span className="ml-2 text-base italic text-ivory/70">arrived</span>
              </>
            ) : (
              "…"
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void onLogout()}
          className="text-xs font-semibold uppercase tracking-[0.16em] text-ivory/60 hover:text-ivory"
        >
          Sign out
        </button>
      </header>

      <div className="relative mx-4 flex flex-1 items-center justify-center overflow-hidden border border-gold/40 bg-black">
        <video
          ref={videoRef}
          className={`absolute inset-0 h-full w-full object-cover ${cameraOn ? "" : "hidden"}`}
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {cameraOn ? (
          <div aria-hidden className="pointer-events-none relative h-60 w-60 max-w-[70vw] max-h-[70vw]">
            <span className="absolute left-0 top-0 h-10 w-10 border-l-4 border-t-4 border-gold-soft" />
            <span className="absolute right-0 top-0 h-10 w-10 border-r-4 border-t-4 border-gold-soft" />
            <span className="absolute bottom-0 left-0 h-10 w-10 border-b-4 border-l-4 border-gold-soft" />
            <span className="absolute bottom-0 right-0 h-10 w-10 border-b-4 border-r-4 border-gold-soft" />
          </div>
        ) : (
          <div className="relative px-6 text-center">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="btn-primary bg-gold text-forest-deep hover:bg-gold-soft"
            >
              Start camera
            </button>
            {cameraError ? (
              <p className="mx-auto mt-5 max-w-xs text-sm text-red-300">{cameraError}</p>
            ) : (
              <p className="mx-auto mt-5 max-w-xs text-sm text-ivory/60">
                Point the camera at a guest&apos;s pass. Each pass works once.
              </p>
            )}
          </div>
        )}
      </div>

      <p className="px-5 py-4 text-center text-sm text-ivory/60">
        {cameraOn ? "Hold the QR code inside the frame" : " "}
      </p>

      {shown ? <ResultOverlay result={shown} /> : null}
    </div>
  );
}

function ResultOverlay({ result }: { result: ScanResult }) {
  const good = result.result === "welcome";
  const title =
    result.result === "welcome"
      ? "Welcome"
      : result.result === "already"
        ? "Already used"
        : result.result === "notfound"
          ? "Not on the list"
          : "Try again";

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`animate-fade fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center text-ivory ${
        good ? "bg-forest" : "bg-[#5a1f1f]"
      }`}
    >
      <div
        className={`flex h-24 w-24 items-center justify-center rounded-full border-2 text-5xl ${
          good ? "border-gold-soft text-gold-soft" : "border-red-200 text-red-200"
        }`}
        aria-hidden
      >
        {good ? "✓" : "!"}
      </div>
      <h2 className="display mt-6 text-5xl">{title}</h2>
      {"name" in result ? (
        <>
          <p className="script mt-4 text-6xl leading-tight">{result.name}</p>
          <p className="mt-4 text-[0.8rem] font-semibold uppercase tracking-[0.28em] text-gold-soft">
            {result.guestCount} {result.guestCount === 1 ? "guest" : "guests"}
            {result.result === "already" && result.checkedInAt
              ? ` · first scanned ${formatTime(result.checkedInAt)}`
              : ""}
          </p>
        </>
      ) : (
        <p className="mt-4 max-w-xs text-ivory/80">
          {result.result === "error"
            ? result.message
            : "This code isn't a valid pass. Please check with the hosts."}
        </p>
      )}
    </div>
  );
}
