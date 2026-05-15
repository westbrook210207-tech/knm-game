create table if not exists public.team_scores (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  round1_tokens integer not null default 10 check (round1_tokens >= 0 and round1_tokens <= 20),
  round1_score integer not null default 3 check (round1_score >= 0 and round1_score <= 5),
  round2_score integer not null default 0 check (round2_score >= 0),
  bonus_score integer not null default 0 check (bonus_score >= 0),
  total_score integer generated always as (round1_score + round2_score + bonus_score) stored,
  updated_at timestamptz not null default now(),
  unique (event_id, team_id)
);

create table if not exists public.round1_bets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  question_index integer not null check (question_index >= 0 and question_index <= 4),
  bet_amount integer not null check (bet_amount >= 1 and bet_amount <= 5),
  resolution text not null default 'pending' check (resolution in ('pending', 'correct', 'wrong')),
  submitted_by_session_id uuid references public.team_sessions(id) on delete set null,
  marked_by_profile_id uuid references public.role_profiles(id) on delete set null,
  marked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, team_id, question_index)
);

create index if not exists team_scores_event_id_idx on public.team_scores(event_id);
create index if not exists team_scores_team_id_idx on public.team_scores(team_id);
create index if not exists round1_bets_event_id_idx on public.round1_bets(event_id);
create index if not exists round1_bets_team_id_idx on public.round1_bets(team_id);
create index if not exists round1_bets_question_idx on public.round1_bets(question_index);
create index if not exists round1_bets_resolution_idx on public.round1_bets(resolution);

grant select on public.team_scores to anon, authenticated;
grant select on public.round1_bets to authenticated;

alter table public.team_scores enable row level security;
alter table public.round1_bets enable row level security;

create policy "team_scores_readable_by_all_clients"
  on public.team_scores
  for select
  using (true);

create policy "round1_bets_select_self_or_admin"
  on public.round1_bets
  for select
  to authenticated
  using (
    private.is_event_admin(event_id)
    or exists (
      select 1
      from public.role_profiles role_profile
      where role_profile.auth_user_id = (select auth.uid())
        and role_profile.role = 'team'
        and role_profile.is_enabled = true
        and role_profile.event_id = round1_bets.event_id
        and role_profile.team_id = round1_bets.team_id
    )
  );

create or replace function private.tokens_to_points(target_tokens integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when target_tokens >= 18 then 5
    when target_tokens >= 14 then 4
    when target_tokens >= 9 then 3
    when target_tokens >= 4 then 2
    when target_tokens >= 0 then 1
    else 0
  end;
$$;

create or replace function private.round1_resolution_effect(
  target_resolution text,
  target_bet_amount integer
)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case target_resolution
    when 'correct' then coalesce(target_bet_amount, 0)
    when 'wrong' then coalesce(target_bet_amount, 0) * -1
    else 0
  end;
$$;

create or replace function private.ensure_team_score_row(
  target_event_id uuid,
  target_team_id uuid
)
returns public.team_scores
language plpgsql
security definer
set search_path = ''
as $$
declare
  ensured_row public.team_scores%rowtype;
begin
  insert into public.team_scores (
    event_id,
    team_id,
    round1_tokens,
    round1_score,
    round2_score,
    bonus_score
  )
  values (
    target_event_id,
    target_team_id,
    10,
    private.tokens_to_points(10),
    0,
    0
  )
  on conflict (event_id, team_id) do nothing;

  select team_score.*
  into ensured_row
  from public.team_scores team_score
  where team_score.event_id = target_event_id
    and team_score.team_id = target_team_id;

  return ensured_row;
end;
$$;

create or replace function private.submit_round1_bet_impl(
  target_question_index integer,
  target_bet_amount integer,
  target_device_fingerprint text
)
returns public.round1_bets
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  team_profile public.role_profiles%rowtype;
  active_session public.team_sessions%rowtype;
  current_state public.game_state%rowtype;
  current_score public.team_scores%rowtype;
  upserted_bet public.round1_bets%rowtype;
begin
  if current_user_id is null then
    raise exception 'Authentication required to submit a Round 1 bet.';
  end if;

  if target_question_index is null or target_question_index < 0 or target_question_index > 4 then
    raise exception 'Round 1 question index % is invalid.', target_question_index;
  end if;

  if target_bet_amount is null or target_bet_amount < 1 or target_bet_amount > 5 then
    raise exception 'Bet amount must be between 1 and 5.';
  end if;

  if target_device_fingerprint is null or length(trim(target_device_fingerprint)) = 0 then
    raise exception 'Device fingerprint is required before a team can place a live bet.';
  end if;

  select role_profile.*
  into team_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'team'
    and role_profile.is_enabled = true
  limit 1;

  if team_profile.id is null then
    raise exception 'Signed-in user does not have a team role for Round 1.';
  end if;

  select team_session.*
  into active_session
  from public.team_sessions team_session
  where team_session.event_id = team_profile.event_id
    and team_session.team_id = team_profile.team_id
    and team_session.auth_user_id = current_user_id
    and team_session.device_fingerprint = target_device_fingerprint
    and team_session.status = 'active'
    and team_session.can_control = true
  order by team_session.created_at desc
  limit 1;

  if active_session.id is null then
    raise exception 'Only the active primary controller can place a live Round 1 bet.';
  end if;

  select game_state.*
  into current_state
  from public.game_state game_state
  where game_state.event_id = team_profile.event_id
  limit 1;

  if current_state.id is null then
    raise exception 'Shared game_state row is missing for this event.';
  end if;

  if current_state.current_phase <> 'round1' then
    raise exception 'Round 1 is not active right now.';
  end if;

  if coalesce(current_state.phase_payload ->> 'stage', '') <> 'betting' then
    raise exception 'Betting is currently locked.';
  end if;

  if current_state.current_question_index is distinct from target_question_index then
    raise exception 'Admin is currently on question %, not %.', current_state.current_question_index, target_question_index;
  end if;

  current_score := private.ensure_team_score_row(team_profile.event_id, team_profile.team_id);

  if current_score.round1_tokens < target_bet_amount then
    raise exception 'This team only has % tokens left, so the bet cannot exceed that.', current_score.round1_tokens;
  end if;

  insert into public.round1_bets (
    event_id,
    team_id,
    question_index,
    bet_amount,
    resolution,
    submitted_by_session_id
  )
  values (
    team_profile.event_id,
    team_profile.team_id,
    target_question_index,
    target_bet_amount,
    'pending',
    active_session.id
  )
  on conflict (event_id, team_id, question_index) do update
    set
      bet_amount = excluded.bet_amount,
      submitted_by_session_id = excluded.submitted_by_session_id,
      updated_at = now()
    where public.round1_bets.resolution = 'pending'
  returning * into upserted_bet;

  if upserted_bet.id is null then
    raise exception 'This Round 1 bet has already been resolved and can no longer be edited.';
  end if;

  update public.team_sessions
  set last_seen_at = now()
  where id = active_session.id;

  return upserted_bet;
end;
$$;

create or replace function public.submit_round1_bet(
  target_question_index integer,
  target_bet_amount integer,
  target_device_fingerprint text
)
returns public.round1_bets
language sql
set search_path = ''
as $$
  select private.submit_round1_bet_impl(
    target_question_index,
    target_bet_amount,
    target_device_fingerprint
  );
$$;

create or replace function private.admin_set_round1_state_impl(
  target_question_index integer,
  target_stage text,
  reveal_correct_option text default null
)
returns public.game_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  admin_profile public.role_profiles%rowtype;
  current_state public.game_state%rowtype;
  next_label text;
  next_payload jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication required to control Round 1.';
  end if;

  if target_stage not in ('betting', 'locked', 'reveal', 'complete') then
    raise exception 'Round 1 stage % is invalid.', target_stage;
  end if;

  if target_stage <> 'complete' and (target_question_index is null or target_question_index < 0 or target_question_index > 4) then
    raise exception 'Round 1 question index % is invalid.', target_question_index;
  end if;

  select role_profile.*
  into admin_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'admin'
    and role_profile.is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can control Round 1 state.';
  end if;

  select game_state.*
  into current_state
  from public.game_state game_state
  where game_state.event_id = admin_profile.event_id
  for update;

  if current_state.id is null then
    raise exception 'Shared game_state row is missing for this event.';
  end if;

  next_label := case target_stage
    when 'betting' then format('Round 1 - Câu %s - Đặt cược', target_question_index + 1)
    when 'locked' then format('Round 1 - Câu %s - Khóa cược', target_question_index + 1)
    when 'reveal' then format('Round 1 - Câu %s - Công bố đáp án', target_question_index + 1)
    when 'complete' then 'Round 1 - Kết thúc'
    else 'Round 1'
  end;

  next_payload := jsonb_build_object(
    'round', 'round1',
    'stage', target_stage,
    'label', next_label,
    'source', 'admin-round1',
    'correctOption', reveal_correct_option,
    'questionIndex', target_question_index
  );

  update public.game_state
  set
    current_phase = 'round1',
    current_question_index = case when target_stage = 'complete' then null else target_question_index end,
    phase_payload = next_payload,
    phase_version = coalesce(current_state.phase_version, 0) + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where id = current_state.id
  returning * into current_state;

  return current_state;
end;
$$;

create or replace function public.admin_set_round1_state(
  target_question_index integer,
  target_stage text,
  reveal_correct_option text default null
)
returns public.game_state
language sql
set search_path = ''
as $$
  select private.admin_set_round1_state_impl(
    target_question_index,
    target_stage,
    reveal_correct_option
  );
$$;

create or replace function private.admin_mark_round1_bet_impl(
  target_team_code text,
  target_question_index integer,
  target_resolution text
)
returns public.round1_bets
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  admin_profile public.role_profiles%rowtype;
  target_bet public.round1_bets%rowtype;
  target_score public.team_scores%rowtype;
  old_effect integer;
  new_effect integer;
  next_tokens integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required to mark a Round 1 bet.';
  end if;

  if target_resolution not in ('correct', 'wrong') then
    raise exception 'Resolution % is invalid.', target_resolution;
  end if;

  select role_profile.*
  into admin_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'admin'
    and role_profile.is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can mark Round 1 bets.';
  end if;

  select round1_bet.*
  into target_bet
  from public.round1_bets round1_bet
  join public.teams team
    on team.id = round1_bet.team_id
  where round1_bet.event_id = admin_profile.event_id
    and team.team_code = target_team_code
    and round1_bet.question_index = target_question_index
  for update;

  if target_bet.id is null then
    raise exception 'No submitted bet found for team % on question %.', target_team_code, target_question_index + 1;
  end if;

  target_score := private.ensure_team_score_row(target_bet.event_id, target_bet.team_id);

  select team_score.*
  into target_score
  from public.team_scores team_score
  where team_score.id = target_score.id
  for update;

  old_effect := private.round1_resolution_effect(target_bet.resolution, target_bet.bet_amount);
  new_effect := private.round1_resolution_effect(target_resolution, target_bet.bet_amount);
  next_tokens := least(20, greatest(0, target_score.round1_tokens - old_effect + new_effect));

  update public.team_scores
  set
    round1_tokens = next_tokens,
    round1_score = private.tokens_to_points(next_tokens),
    updated_at = now()
  where id = target_score.id;

  update public.round1_bets
  set
    resolution = target_resolution,
    marked_by_profile_id = admin_profile.id,
    marked_at = now(),
    updated_at = now()
  where id = target_bet.id
  returning * into target_bet;

  return target_bet;
end;
$$;

create or replace function public.admin_mark_round1_bet(
  target_team_code text,
  target_question_index integer,
  target_resolution text
)
returns public.round1_bets
language sql
set search_path = ''
as $$
  select private.admin_mark_round1_bet_impl(
    target_team_code,
    target_question_index,
    target_resolution
  );
$$;

grant execute on function public.submit_round1_bet(integer, integer, text) to authenticated;
grant execute on function public.admin_set_round1_state(integer, text, text) to authenticated;
grant execute on function public.admin_mark_round1_bet(text, integer, text) to authenticated;

drop trigger if exists team_scores_set_updated_at on public.team_scores;
create trigger team_scores_set_updated_at
before update on public.team_scores
for each row execute function public.set_updated_at();

drop trigger if exists round1_bets_set_updated_at on public.round1_bets;
create trigger round1_bets_set_updated_at
before update on public.round1_bets
for each row execute function public.set_updated_at();

insert into public.team_scores (
  event_id,
  team_id,
  round1_tokens,
  round1_score,
  round2_score,
  bonus_score
)
select
  team.event_id,
  team.id,
  10,
  private.tokens_to_points(10),
  0,
  0
from public.teams team
on conflict (event_id, team_id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_scores'
  ) then
    execute 'alter publication supabase_realtime add table public.team_scores';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'round1_bets'
  ) then
    execute 'alter publication supabase_realtime add table public.round1_bets';
  end if;
end
$$;
