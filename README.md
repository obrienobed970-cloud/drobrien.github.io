# O’Brien Zakumi Obed: research website

Next.js (App Router) site with server-side rendering, MongoDB storage and a private admin console.
One deployment serves the public site, the admin console and the database-backed content.

## Environment variables

| Name | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string (`mongodb+srv://user:pass@cluster/...`); recommended variable. `MONGODB_DB` is also accepted as a legacy alias. |
| `MONGODB_NAME` | Optional database name (default `obed_research`). |
| `AUTH_SECRET` | Random string, 32+ characters, used to sign admin sessions. |
| `ADMIN_PATH` | Secret URL slug for the admin console, e.g. `console-d43f59af4d26` → `https://obrienobed.com/console-d43f59af4d26`. |

## Local development

```bash
npm install
npm run seed -- <admin-email> <admin-password>   # creates the first admin + seeds existing content (safe to re-run)
npm run dev
```

## Admin console

- Only reachable at `/<ADMIN_PATH>`; `/console` itself returns 404 and the page is marked `noindex`.
- Admins can upload/edit/delete publications and research-digest posts, change their password, and create or remove other admins.
- Changing a password signs out that admin’s other sessions.

## Deploying (Vercel)

1. Import this repository in Vercel (framework preset: Next.js).
2. Add the environment variables above in *Project → Settings → Environment Variables*.
3. In MongoDB Atlas → *Network Access*, allow Vercel to connect (e.g. `0.0.0.0/0`, since Vercel has no fixed IPs on most plans).
4. Point the `obrienobed.com` domain at the Vercel project, and turn off GitHub Pages for this repository.

MongoDB Atlas database users authenticate against `admin` by default. The app uses that auth source when the connection string does not include `authSource`; an explicit `authSource` in the URI is preserved.
