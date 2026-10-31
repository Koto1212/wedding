import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  GOOGLE_SCOPES,
  GOOGLE_STATE_COOKIE,
  googleRedirectUri,
  isGoogleConfigured,
} from "@/lib/google";

// Starts "Sign in with Google": sends the host to Google's consent screen.
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/admin?google=not-configured", request.url));
  }

  const state = randomBytes(24).toString("base64url");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: googleRedirectUri(),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const response = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
  // Set on the response so Set-Cookie reaches the browser on Netlify.
  response.cookies.set(GOOGLE_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/admin/google",
    maxAge: 600,
  });
  return response;
}
