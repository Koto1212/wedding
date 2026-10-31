import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  getGmailCredentials,
  removeGmailCredentials,
  saveGmailCredentials,
} from "@/lib/gmail";

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
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        // Gmail refuses normal account passwords for sending mail; only a
        // 16-character app password works.
        { error: "Enter your 16-character Gmail app password (your normal Gmail password won't work)." },
        { status: 400 },
      );
    }

    const saved = await saveGmailCredentials(email, password);
    return NextResponse.json({ ok: true, email: saved.email });
  } catch {
    return NextResponse.json({ error: "Could not save Gmail login." }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  await removeGmailCredentials();
  return NextResponse.json({ ok: true });
}
