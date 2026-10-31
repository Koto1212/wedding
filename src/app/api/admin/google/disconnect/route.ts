import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { removeGoogleAccount } from "@/lib/google";

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await removeGoogleAccount();
  return NextResponse.json({ ok: true });
}
