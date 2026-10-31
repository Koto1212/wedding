# Wedding Invite Platform

Personal wedding invitation site with guest RSVP, QR entry passes (email and
WhatsApp), a door scanner, and a private host dashboard.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the invitation,
[/admin](http://localhost:3000/admin) for the host dashboard and
[/door](http://localhost:3000/door) for the door scanner.

## Configure

1. Copy `.env.local.example` to `.env.local` and fill in the values.
2. Edit couple/event details in `src/lib/wedding.ts`.

Locally, guests and the Google sign-in are stored in `data/*.json`
(created automatically). On Netlify they are stored in Netlify Blobs instead.

## Deploy to Netlify

1. Push this folder to a GitHub repository and choose **Add new site → Import
   an existing project** in Netlify. The settings in `netlify.toml` are picked
   up automatically.
2. In **Site configuration → Environment variables**, add the same values as
   `.env.local`: `ADMIN_PASSWORD`, `ADMIN_SECRET`, `DOOR_PASSWORD`,
   `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (or `GMAIL_USER` and
   `GMAIL_APP_PASSWORD`). `SITE_URL` is optional — without it the site uses
   its Netlify address; set it if you add your own domain.
3. In Google Cloud Console, add
   `https://<your-site>.netlify.app/api/admin/google/callback` to the OAuth
   client's authorised redirect URIs, then sign in with Google again from the
   live dashboard.
4. Before inviting anyone, test once on the live site: RSVP → email/WhatsApp
   pass → scan at `/door` → arrival shows on the dashboard.

Data from `data/*.json` on your computer is not uploaded; the live site starts
with an empty guest list.
