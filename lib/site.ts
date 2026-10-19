/* ============================================================
   SITE CONFIG - the only file that differs between the
   BroadArks and BroadArks Foundation admin panels (apart from
   brand colours in globals.css and the SQL table prefix).

   Table names carry a per-site prefix so both panels can live
   in the same Supabase project without clashing - keep them in
   sync with supabase/setup.sql.
   ============================================================ */

export const SITE = {
  name: "BroadArks",
  panelName: "BroadArks Admin",
  monogram: "BA",
  websiteUrl: "https://broadarks.com",
  websiteLabel: "broadarks.com",
  sessionCookie: "ba_session",
  tables: {
    users: "ba_admin_users",
    submissions: "ba_submissions",
  },
} as const;
