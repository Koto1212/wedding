import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getGmailCredentials,
  removeGmailCredentials,
  saveGmailCredentials,
} from "@/lib/gmail";
import { clampString, isValidEmail, LIMITS } from "@/lib/validate";

export const dynamic = "force-dynamic";

async function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  const saved = await getGmailCredentials();
  return NextResponse.json({ email: saved?.email ?? null });
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = clampString(body.email, LIMITS.email).toLowerCase();
    const password = clampString(body.password, LIMITS.password);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    // Gmail app passwords are 16 chars; allow a bit of slack for spaces (stripped).
    if (password.replace(/\s+/g, "").length < 8) {
      return NextResponse.json(
        { error: "Enter your Gmail app password." },
        { status: 400 },
      );
    }

    const saved = await saveGmailCredentials(email, password);
    return NextResponse.json({ ok: true, email: saved.email });
  } catch (err) {
    console.error("Could not save Gmail login:", err);
    return NextResponse.json({ error: "Could not save Gmail login." }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  await removeGmailCredentials();
  return NextResponse.json({ ok: true });
}
