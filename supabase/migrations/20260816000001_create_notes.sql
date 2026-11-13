create schema if not exists block;

create table block.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  date date,
  time text,
  event_text text,
  category text check (category in ('work', 'study', 'personal', 'important')),
  recurrence text check (recurrence in ('weekly', 'monthly')),
  reminder_minutes integer check (reminder_minutes between 0 and 1440),
  completed_occurrences jsonb not null default '{}'::jsonb,
  is_today_task boolean not null default false
);

create index notes_user_id_date_idx on block.notes (user_id, date);

alter table block.notes enable row level security;

create policy "Users can read their own notes"
on block.notes for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own notes"
on block.notes for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own notes"
on block.notes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own notes"
on block.notes for delete
to authenticated
using ((select auth.uid()) = user_id);