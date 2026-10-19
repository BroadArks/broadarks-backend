# BroadArks Admin (`broadarks-backend`)

A small, secure Next.js admin panel for the **broadarks.com** website. It does one
job: shows the **applications** and **contact-form enquiries** people submit on the
site. No blog, no content editing.

- 📬 **Submissions** inbox — contact forms and applications in one list, with
  tabs (All / Contact forms / Applications), search, and status (new / read / archived).
- 👑 **One super admin** (enforced by the database) who can give people access,
  reset anyone's password, disable/enable accounts, delete accounts and submissions,
  and choose who is shown on the forgot-password page.
- 👤 **Admins** can view and triage submissions and manage their own profile/password.
- 🔑 **Forgot password?** — no email reset flow. The page lists the contact people
  (name, email, phone) to ask for a reset.
- 🔐 Passwords hashed with PBKDF2; resetting a password or disabling an account
  signs that person out of every device immediately.

---

## 1. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com) — or reuse the Y&Now one;
   all tables here are prefixed `ba_`, so nothing clashes.
2. **SQL Editor → New query**, paste [`supabase/setup.sql`](supabase/setup.sql), **Run**.
   That creates:

   | table | purpose |
   | --- | --- |
   | `ba_admin_users` | panel logins: `username`, `full_name`, `email`, `phone`, `role` (`super_admin`/`admin`), `is_active`, `is_reset_contact`, `password_hash`, `session_version`, `last_login_at` |
   | `ba_submissions` | form submissions: `kind` (`contact`/`application`), `name`, `email`, `phone`, `organisation`, `topics[]`, `message`, `position`, `resume_url`, `details` (jsonb), `source_page`, `status`, `created_at` |

   …and seeds the super admin:

   | Username | Password |
   | --- | --- |
   | `superadmin` | `ChangeMe@2026` |

   > **Sign in and change this password immediately** (My account → Change password),
   > and set your real name / email / phone — they appear on the forgot-password page.

[`supabase/admin-queries.sql`](supabase/admin-queries.sql) has ready-made queries for
the SQL Editor (reset a locked-out super admin, hand over the super admin role, list
new submissions, …).

## 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key (not used by the panel itself, kept for parity) |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key — **server only, keep secret** |
| `AUTH_SECRET` | long random string — `openssl rand -hex 32` |

## 3. Run it

```bash
npm install
npm run dev        # http://localhost:3011
```

## 4. Connect the website

The contact form in the `brobro` site posts straight to Supabase with the **anon** key.
In `brobro/.env.local` set:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

The anon key can only **insert** into `ba_submissions` (only the form columns — it can't
set `status` or `created_at`) and can never read anything back.

### Sending applications

There's no application form on the site yet. When you add one (e.g. a careers form),
insert a row with `kind: "application"` and fill `position`, `resume_url` (a link to the
CV), and anything else into `details` (shown as key/value pairs in the panel):

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
    details: { experience_years: "4", city: "Bhopal" },
    source_page: "/careers",
  }),
});
```

## Who can do what

| | Super admin | Admin |
| --- | :---: | :---: |
| View submissions, mark read/new/archived | ✅ | ✅ |
| Delete submissions | ✅ | — |
| Edit own name/email/phone, change own password | ✅ | ✅ |
| Add accounts, reset passwords, disable/enable, delete accounts | ✅ | — |
| Choose who appears on the forgot-password page | ✅ | — |

If no one is marked as a reset contact, the forgot-password page shows the super admin.

## Security notes

- All pages and `/api/*` routes are gated by `proxy.ts`; every API route re-checks the
  session **and** the role from the database (defence in depth).
- Sessions are HMAC-signed `httpOnly` cookies carrying the account's `session_version`;
  a password reset or disable bumps it, so old cookies stop working instantly.
- The panel sends `X-Robots-Tag: noindex` on every response.
