// Public address of the site. QR codes, pass links and the Google sign-in
// return address point here, so it must be reachable from guests' phones.
// On Netlify, its own `URL` is used when SITE_URL isn't set.
export function siteUrl(): string {
  return (process.env.SITE_URL || process.env.URL || "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}
