grant usage on schema block to authenticated;
grant select, insert, update, delete on table block.notes to authenticated;

alter table block.notes enable row level security;

drop policy if exists "Users can update their own notes" on block.notes;

create policy "Users can update their own notes"
on block.notes for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);