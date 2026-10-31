import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  GOOGLE_STATE_COOKIE,
  googleRedirectUri,
  isGoogleConfigured,
  saveGoogleAccount,
} from "@/lib/google";
import { safeEqual } from "@/lib/secrets";

export const dynamic = "force-dynamic";

function back(request: Request, result: string) {
  const response = NextResponse.redirect(
    new URL(`/admin?google=${result}`, request.url),
  );
  response.cookies.set(GOOGLE_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/google",
    maxAge: 0,
  });
  return response;
}

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (!isGoogleConfigured()) return back(request, "not-configured");

  const url = new URL(request.url);
  const jar = await cookies();
  const expectedState = jar.get(GOOGLE_STATE_COOKIE)?.value;

  if (url.searchParams.get("error")) return back(request, "cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (
    !code ||
    !state ||
    !expectedState ||
    code.length > 2048 ||
    state.length > 256 ||
    !safeEqual(state, expectedState)
  ) {
    return back(request, "error");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(),
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      scope?: string;
    };
    if (!tokenRes.ok || !tokens.access_token || !tokens.refresh_token) {
      console.error("Google token exchange failed", tokenRes.status);
      return back(request, "error");
    }
    if (!tokens.scope?.includes("gmail.send")) {
      return back(request, "no-send-permission");
    }

    const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = (await infoRes.json()) as { email?: string };
    if (!infoRes.ok || !info.email) return back(request, "error");

    await saveGoogleAccount({
      email: info.email,
      refreshToken: tokens.refresh_token,
      connectedAt: new Date().toISOString(),
    });
    return back(request, "connected");
  } catch (err) {
    console.error("Google sign-in failed", err);
    return back(request, "error");
  }
}
