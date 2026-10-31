// Gold flourish used as a divider on the invitation and section headings.
export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 240 24"
      className={`h-5 w-48 text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
    >
      <path d="M4 12h76" opacity="0.6" />
      <path d="M160 12h76" opacity="0.6" />
      <path d="M80 12c10 0 14-8 22-8s10 8 18 8-10 8-18 8-12-8-22-8" />
      <path d="M160 12c-10 0-14-8-22-8s-10 8-18 8 10 8 18 8 12-8 22-8" />
      <circle cx="120" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="236" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Small corner flourish for framed cards. Rotate per corner.
export function Corner({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={`absolute h-10 w-10 text-gold ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <path d="M2 30V2h28" />
      <path d="M8 22V8h14" opacity="0.7" />
      <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
