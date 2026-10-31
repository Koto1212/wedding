import { wedding } from "./wedding";

// Turns what a guest typed ("079 123 4567", "+962 79…", "00962…") into the
// digits-only international form WhatsApp links need, or null if unusable.
export function toWhatsappNumber(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  if (phone.trim().startsWith("+")) {
    // already international
  } else if (digits.startsWith("00")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = wedding.phoneCountryCode + digits.slice(1);
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}
