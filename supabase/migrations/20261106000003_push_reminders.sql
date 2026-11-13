create table block.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique check (
    length(endpoint) <= 2048 and
    endpoint ~ '^https://(fcm\.googleapis\.com|([a-z0-9-]+\.)+push\.apple\.com|updates\.push\.services\.mozilla\.com)/'
  ),
  p256dh text not null check (length(p256dh) between 1 and 256),
  auth text not null check (length(auth) between 1 and 256),
  timezone text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on block.push_subscriptions (user_id);
alter table block.push_subscriptions enable row level security;
grant select, insert, update, delete on block.push_subscriptions to authenticated;
grant usage on schema block to service_role;
grant all on block.push_subscriptions to service_role;

create policy "Users can read their own push subscriptions" on block.push_subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own push subscriptions" on block.push_subscriptions
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own push subscriptions" on block.push_subscriptions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Users can delete their own push subscriptions" on block.push_subscriptions
  for delete to authenticated using ((select auth.uid()) = user_id);

create function block.validate_push_timezone() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    raise exception 'Invalid timezone';
  end if;
  return new;
end;
$$;
create trigger validate_push_timezone before insert or update of timezone on block.push_subscriptions
  for each row execute function block.validate_push_timezone();

create table block.push_deliveries (
  subscription_id uuid not null references block.push_subscriptions(id) on delete cascade,
  note_id uuid not null references block.notes(id) on delete cascade,
  occurrence_date date not null,
  reminder_at timestamptz not null,
  claim_id uuid not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (subscription_id, note_id, occurrence_date, reminder_at)
);
alter table block.push_deliveries enable row level security;
grant all on block.push_deliveries to service_role;

create function block.due_push_reminders()
returns table (subscription_id uuid, note_id uuid, occurrence_date date, reminder_at timestamptz,
  endpoint text, p256dh text, auth text, event_text text, event_time text)
language sql security definer set search_path = '' as $$
  with candidates as (
    select s.id as subscription_id, n.id as note_id, d.occurrence_date,
      ((d.occurrence_date + case when n.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then n.time::time end) at time zone s.timezone)
        - make_interval(mins => coalesce(n.reminder_minutes, 15)) as reminder_at,
      s.endpoint, s.p256dh, s.auth, coalesce(nullif(n.event_text, ''), n.content) as event_text,
      n.time as event_time
    from block.push_subscriptions s
    join block.notes n on n.user_id = s.user_id
    cross join lateral (
      select ((now() at time zone s.timezone)::date + offset_days) as occurrence_date
      from generate_series(0, 1) as offset_days
    ) d
    where n.date is not null
      and n.time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      and d.occurrence_date >= n.date
      and (d.occurrence_date = n.date
        or (n.recurrence = 'weekly' and extract(dow from d.occurrence_date) = extract(dow from n.date))
        or (n.recurrence = 'monthly' and extract(day from d.occurrence_date) = extract(day from n.date)))
      and not (coalesce(n.completed_occurrences, '{}'::jsonb) ? d.occurrence_date::text)
  )
  select c.subscription_id, c.note_id, c.occurrence_date, c.reminder_at,
    c.endpoint, c.p256dh, c.auth, c.event_text, c.event_time
  from candidates c
  where c.reminder_at <= now() and c.reminder_at > now() - interval '5 minutes'
    and not exists (
      select 1 from block.push_deliveries pd
      where pd.subscription_id = c.subscription_id and pd.note_id = c.note_id
        and pd.occurrence_date = c.occurrence_date and pd.reminder_at = c.reminder_at
        and (pd.sent_at is not null or pd.claimed_at > now() - interval '2 minutes')
    );
$$;

create function block.claim_push_reminder(p_subscription_id uuid, p_note_id uuid, p_occurrence_date date, p_reminder_at timestamptz)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_claim uuid := gen_random_uuid();
begin
  if not exists (
    select 1 from block.due_push_reminders() due
    where due.subscription_id = p_subscription_id and due.note_id = p_note_id
      and due.occurrence_date = p_occurrence_date and due.reminder_at = p_reminder_at
  ) then return null; end if;
  insert into block.push_deliveries (subscription_id, note_id, occurrence_date, reminder_at, claim_id)
  values (p_subscription_id, p_note_id, p_occurrence_date, p_reminder_at, v_claim)
  on conflict (subscription_id, note_id, occurrence_date, reminder_at) do update
    set claim_id = excluded.claim_id, claimed_at = now()
    where block.push_deliveries.sent_at is null and block.push_deliveries.claimed_at <= now() - interval '2 minutes';
  if not found then return null; end if;
  return v_claim;
end;
$$;

revoke all on function block.due_push_reminders() from public, anon, authenticated;
revoke all on function block.claim_push_reminder(uuid, uuid, date, timestamptz) from public, anon, authenticated;
grant execute on function block.due_push_reminders() to service_role;
grant execute on function block.claim_push_reminder(uuid, uuid, date, timestamptz) to service_role;
