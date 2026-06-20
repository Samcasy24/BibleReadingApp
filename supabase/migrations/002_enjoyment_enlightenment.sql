-- Migration 002: Split reflection note into Enjoyment and Enlightenment

alter table public.reading_logs
  rename column note to enjoyment;

alter table public.reading_logs
  add column enlightenment text
    constraint enlightenment_length check (char_length(enlightenment) <= 500);

-- Update the note length constraint name to match new column
alter table public.reading_logs
  rename constraint note_length to enjoyment_length;
