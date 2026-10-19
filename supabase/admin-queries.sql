-- ============================================================
--  BroadArks Admin - handy queries for the Supabase SQL Editor.
--  Run them one at a time (select a block → Run).
--
--  Password hashes are generated locally with:
--      node scripts/hash-password.mjs 'the-new-password'
-- ============================================================

-- ---- Locked out? Reset the SUPER ADMIN's password ----------
-- (bumping session_version signs them out of every device)
update public.ba_admin_users
set password_hash   = 'pbkdf2$...paste-hash-here...',
    session_version = session_version + 1,
    is_active       = true
where role = 'super_admin';

-- ---- Hand the super admin role to someone else -------------
-- Only one super admin may exist, so demote first, then promote.
begin;
update public.ba_admin_users set role = 'admin' where role = 'super_admin';
update public.ba_admin_users set role = 'super_admin', is_active = true where username = 'new-owner';
commit;

-- ---- Who can sign in? ----------------------------------------
select username, full_name, role, is_active, is_reset_contact, last_login_at
from public.ba_admin_users
order by role desc, created_at;

-- ---- Who is shown on the forgot-password page? --------------
select full_name, email, phone
from public.ba_admin_users
where is_active and (is_reset_contact or role = 'super_admin');

-- ---- New (unread) submissions --------------------------------
select kind, name, email, phone, organisation, topics, created_at
from public.ba_submissions
where status = 'new'
order by created_at desc;

-- ---- Applications only ---------------------------------------
select name, email, phone, position, resume_url, created_at
from public.ba_submissions
where kind = 'application'
order by created_at desc;

-- ---- Clear out archived submissions older than a year --------
delete from public.ba_submissions
where status = 'archived' and created_at < now() - interval '1 year';
