export type RsvpStatus = "attending" | "declined" | "maybe" | "pending";

export type Guest = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: RsvpStatus;
  guestCount: number;
  mealPreference: string;
  message: string;
  // When a host last opened WhatsApp to send this guest their pass
  whatsappSentAt: string | null;
  // One-time check-in code encoded in the guest's QR
  checkInToken: string;
  checkedInAt: string | null;
  qrSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GuestInput = {
  name: string;
  email: string;
  phone?: string;
  status: RsvpStatus;
  guestCount: number;
  mealPreference?: string;
  message?: string;
};
