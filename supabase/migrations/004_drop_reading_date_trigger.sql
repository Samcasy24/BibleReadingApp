-- Migration 004: Remove check_reading_date trigger
-- The date enforcement is handled client-side.
-- The server-side trigger causes false rejections for users
-- in timezones ahead of UTC.

drop trigger if exists enforce_reading_date on public.reading_logs;
drop function if exists public.check_reading_date();
