-- ============================================================
--  BroadArks Admin - Supabase setup
--  Run once in: Supabase dashboard → SQL Editor → New query → Run.
--  Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
--  Creates (all prefixed `ba_` so they can share a Supabase
--  project with the Y&Now and Foundation panels):
--    • ba_admin_users  - panel logins, with ONE super admin
--    • ba_submissions  - contact-form enquiries + applications
--  …plus row-level security and a seeded super admin login:
--
--      username: superadmin     password: ChangeMe@2026
--
--  ⚠️  Sign in and change that password straight away
--     (My account → Change password), and fill in your real
--     name / email / phone - they're shown on the public
--     forgot-password page.
-- ============================================================

create extension if not exists pgcrypto;

-- Keep updated_at fresh on every write.
create or replace function public.ba_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
--  ADMIN USERS
-- ------------------------------------------------------------
create table if not exists public.ba_admin_users (
  id               uuid primary key default gen_random_uuid(),
  username         text unique not null check (username ~ '^[a-z0-9_.-]{3,32}$'),
  full_name        text not null default '',
  email            text,
  phone            text,
  role             text not null default 'admin' check (role in ('super_admin', 'admin')),
  is_active        boolean not null default true,      -- false = access revoked
  is_reset_contact boolean not null default false,     -- listed on the forgot-password page
  password_hash    text not null,                      -- PBKDF2, never plain text
  session_version  integer not null default 1,         -- bump to sign the user out everywhere
  last_login_at    timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Exactly one super admin: a second row with role = 'super_admin' is rejected.
create unique index if not exists ba_admin_users_single_super_admin
  on public.ba_admin_users (role) where role = 'super_admin';

drop trigger if exists ba_admin_users_set_updated_at on public.ba_admin_users;
create trigger ba_admin_users_set_updated_at
  before update on public.ba_admin_users
  for each row execute function public.ba_set_updated_at();

-- ------------------------------------------------------------
--  SUBMISSIONS  (written by the public website's forms)
--    kind = 'contact'      → contact-us form
--    kind = 'application'  → careers / programme applications
-- ------------------------------------------------------------
create table if not exists public.ba_submissions (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null default 'contact' check (kind in ('contact', 'application')),
  name         text not null check (char_length(name) between 1 and 200),
  email        text not null check (char_length(email) between 3 and 320),
  phone        text check (char_length(phone) <= 40),
  organisation text check (char_length(organisation) <= 200),
  topics       text[] not null default '{}' check (cardinality(topics) <= 20),
  message      text not null default '' check (char_length(message) <= 10000),
  position     text check (char_length(position) <= 200),       -- role applied for
  resume_url   text check (char_length(resume_url) <= 2000),    -- link to CV / portfolio
  details      jsonb not null default '{}'::jsonb
                 check (jsonb_typeof(details) = 'object' and pg_column_size(details) <= 16384),
  source_page  text check (char_length(source_page) <= 300),
  status       text not null default 'new' check (status in ('new', 'read', 'archived')),
  created_at   timestamptz not null default now()
);

create index if not exists ba_submissions_created_at_idx on public.ba_submissions (created_at desc);
create index if not exists ba_submissions_status_idx on public.ba_submissions (status);
create index if not exists ba_submissions_kind_idx on public.ba_submissions (kind);

-- ============================================================
--  ROW-LEVEL SECURITY & GRANTS
--
--  The admin panel uses the SERVICE-ROLE key (server-side only),
--  which bypasses RLS - so it always has full access.
--
--  The public website uses the ANON key. It may only INSERT a
--  submission (only the form columns - it can't set status or
--  created_at), and can never read anything back. Admin users
--  are completely invisible to anon / authenticated.
-- ============================================================
alter table public.ba_admin_users enable row level security;
alter table public.ba_submissions enable row level security;

revoke all on public.ba_admin_users from anon, authenticated;
revoke all on public.ba_submissions from anon, authenticated;

grant insert (kind, name, email, phone, organisation, topics, message,
              position, resume_url, details, source_page)
  on public.ba_submissions to anon;

drop policy if exists "website can submit forms" on public.ba_submissions;
create policy "website can submit forms"
  on public.ba_submissions for insert
  to anon
  with check (status = 'new');

-- ============================================================
--  SEED: the super admin
--  Edit full_name / email / phone below BEFORE running if you
--  like - or change them later in the panel (My account).
-- ============================================================
insert into public.ba_admin_users
  (username, full_name, email, phone, role, is_reset_contact, password_hash)
values (
  'superadmin',
  'Super Admin',
  'info@broadarks.com',
  '0755 3553372',
  'super_admin',
  true,
  'pbkdf2$210000$IeimXn-Vveaj4ek6Uad8uA$70qxhHK3-6IpZ8I7zqm2HJAvZCEiml6F1OpeYOC6Gsc'  -- ChangeMe@2026
)
on conflict (username) do nothing;
