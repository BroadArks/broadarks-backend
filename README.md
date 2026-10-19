# BroadArks Admin

Admin panel for the **BroadArks** (broadarks.com) website. It shows the **contact-form enquiries** and
**applications** people submit on the site — nothing else (no blog, no content editing).

Built with Next.js 16 + Supabase. Runs on **http://localhost:3011**.

## Features

- **Submissions inbox** — contact forms and applications in one list, filterable by type
  and status (new / read / archived), with search.
- **One super admin** — enforced by the database. Gives people access, resets passwords,
  disables or deletes accounts, deletes submissions, and picks who is listed on the
  forgot-password page.
- **Admins** — view and triage submissions; edit their own profile and password.
- **Forgot password** — no email reset. The page lists the people to contact (name,
  email, phone) for a reset. If no one is chosen, it shows the super admin.
- **Instant sign-out** — resetting a password or disabling an account ends that
  person's sessions on every device.

| | Super admin | Admin |
| --- | :---: | :---: |
| View submissions, mark read / new / archived | ✓ | ✓ |
| Delete submissions | ✓ | |
| Edit own profile, change own password | ✓ | ✓ |
| Add, disable, delete accounts; reset passwords | ✓ | |
| Choose forgot-password contacts | ✓ | |

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill it in, see below
npm run dev                  # http://localhost:3011
```

### 1. Database

This panel shares the **Y&Now Supabase project**. Its tables are prefixed `ba_` so they
never touch the Y&Now tables (`posts`, `admin_users`, `enquiries`).

In Supabase → **SQL Editor → New query**, paste [`supabase/setup.sql`](supabase/setup.sql)
and **Run**. It's safe to re-run. It creates:

| Table | Holds |
| --- | --- |
| `ba_admin_users` | Panel logins, roles, contact details, access flags |
| `ba_submissions` | Form submissions from the website |

It also seeds the super admin login:

| Username | Password |
| --- | --- |
| `superadmin` | `ChangeMe@2026` |

> Sign in and change this password straight away (**My account**), and set your real
> name, email and phone — they're shown on the forgot-password page.

### 2. Environment variables

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `yandnow-backend` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `yandnow-backend` |
| `SUPABASE_SERVICE_ROLE_KEY` | Same as `yandnow-backend` — server only, never expose |
| `AUTH_SECRET` | Unique to this panel — `openssl rand -hex 32` |
| `AUTH_SESSION_TTL` | Optional, login lifetime in seconds (default 7 days) |

### 3. Website

The contact form in the `brobro` site writes directly to `ba_submissions`. Set these in
`brobro/.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The anon key can only **insert** form fields. It can't set a status and can't read
anything back.

## Adding an application form

There's no application form on the site yet. When you build one, post a row with
`kind: "application"`. Anything extra goes in `details` and is shown in the panel as
key/value pairs.

```js
await fetch(`${SUPABASE_URL}/rest/v1/ba_submissions`, {
  method: "POST",
  headers: {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  },
  body: JSON.stringify({
    kind: "application",
    name, email, phone,
    position: "Trainer — Future Skills",
    resume_url: "https://…/cv.pdf",
    message: coverLetter,
    details: { city: "Bhopal" },
    source_page: "/careers",
  }),
});
```

## Useful SQL

[`supabase/admin-queries.sql`](supabase/admin-queries.sql) has ready-made queries:
reset a locked-out super admin, hand the super admin role to someone else, list new
submissions, and clean up old archived ones.

Password hashes for manual SQL are generated with:

```bash
node scripts/hash-password.mjs 'new-password'
```

## Project layout

```
app/
  (app)/submissions    inbox (default page)
  (app)/accounts       accounts & access — super admin only
  (app)/account        my account
  login, forgot-password
  api/                 route handlers (auth, submissions, accounts, me)
components/            SubmissionsList, AccountsManager, MyAccount, AdminShell
lib/site.ts            branding, table names, cookie name
lib/                   auth, sessions, data access
proxy.ts               blocks every page and API route until signed in
supabase/              setup.sql, admin-queries.sql
```

## Troubleshooting

- **"Couldn't reach the database"** — check `.env.local`, and that `supabase/setup.sql`
  has been run in the same project.
- **Locked out of the super admin** — use the first query in `supabase/admin-queries.sql`.
- **Signed out unexpectedly** — your password was reset or your account was disabled.

## Security

- Every page and API route needs a signed-in session. API routes also re-check the
  user's role in the database.
- Sessions are signed, `httpOnly` cookies tied to the account's `session_version`.
- Passwords are hashed with PBKDF2 (210k iterations).
- Every response sends `X-Robots-Tag: noindex`.
