-- ============================================================
-- Pa Notes — Seed Script
-- NOTE: Create alice@example.com and bob@example.com in the
-- Supabase Auth dashboard first (Authentication > Users > Add user).
-- Then run this script to ensure their profiles exist.
-- ============================================================

-- If profiles weren't auto-created by the trigger, insert manually:
-- Replace the UUIDs below with the actual user IDs from auth.users.

-- insert into profiles (id, email, display_name)
-- values
--   ('<alice-uuid>', 'alice@example.com', 'Alice Owner'),
--   ('<bob-uuid>',   'bob@example.com',   'Bob Shared User')
-- on conflict (id) do update set display_name = excluded.display_name;
