import { getGuestByToken } from "@/lib/db";
import { renderPassCard } from "@/lib/passCard";

// The pass as an image: WhatsApp's link preview, and "Save image" on the pass page.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const guest = await getGuestByToken(token);
  if (!guest || guest.status !== "attending") {
    return new Response("Not found", { status: 404 });
  }
  return renderPassCard(guest);
}
