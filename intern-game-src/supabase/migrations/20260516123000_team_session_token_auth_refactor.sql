alter table public.team_sessions
  alter column auth_user_id drop not null;

alter table public.team_sessions
  add column if not exists session_token text;

create unique index if not exists team_sessions_session_token_key
  on public.team_sessions(session_token)
  where session_token is not null;

create table if not exists private.team_access_credentials (
  team_id uuid primary key references public.teams(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_access_credentials_event_id_idx
  on private.team_access_credentials(event_id);

drop trigger if exists set_team_access_credentials_updated_at on private.team_access_credentials;
create trigger set_team_access_credentials_updated_at
before update on private.team_access_credentials
for each row
execute function public.set_updated_at();

insert into private.team_access_credentials (
  team_id,
  event_id,
  password_hash
)
select
  team.id,
  team.event_id,
  extensions.crypt('TempPass123!', extensions.gen_salt('bf'))
from public.teams team
on conflict (team_id) do nothing;

create or replace function private.get_team_access_credential(
  target_event_id uuid,
  target_team_code text
)
returns private.team_access_credentials
language plpgsql
security definer
set search_path = ''
as $$
declare
  credential private.team_access_credentials%rowtype;
begin
  select team_access_credential.*
  into credential
  from private.team_access_credentials team_access_credential
  join public.teams team
    on team.id = team_access_credential.team_id
  where team_access_credential.event_id = target_event_id
    and team.team_code = target_team_code
  limit 1;

  return credential;
end;
$$;

create or replace function private.require_team_session(
  target_event_slug text,
  target_session_token text
)
returns public.team_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_session public.team_sessions%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if target_session_token is null or length(trim(target_session_token)) = 0 then
    raise exception 'Invalid team session.';
  end if;

  select team_session.*
  into active_session
  from public.team_sessions team_session
  where team_session.event_id = target_event_id
    and team_session.session_token = target_session_token
    and team_session.status = 'active'
  order by team_session.created_at desc
  limit 1;

  if active_session.id is null then
    raise exception 'Invalid team session.';
  end if;

  update public.team_sessions
  set last_seen_at = now()
  where id = active_session.id;

  select team_session.*
  into active_session
  from public.team_sessions team_session
  where team_session.id = active_session.id
  limit 1;

  return active_session;
end;
$$;

create or replace function public.join_team_session(
  target_event_slug text,
  target_team_code text,
  target_password text,
  target_session_token text,
  device_label text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  target_team public.teams%rowtype;
  existing_session public.team_sessions%rowtype;
  credential private.team_access_credentials%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if target_team_code is null or length(trim(target_team_code)) = 0 then
    raise exception 'Team code is required.';
  end if;

  if target_password is null or length(target_password) = 0 then
    raise exception 'Mật khẩu phòng ban là bắt buộc.';
  end if;

  if target_session_token is null or length(trim(target_session_token)) = 0 then
    raise exception 'Session token is required.';
  end if;

  select team.*
  into target_team
  from public.teams team
  where team.event_id = target_event_id
    and team.team_code = target_team_code
    and team.is_active = true
  limit 1;

  if target_team.id is null then
    raise exception 'Team route % does not exist for this event.', target_team_code;
  end if;

  credential := private.get_team_access_credential(target_event_id, target_team_code);

  if credential.team_id is null or credential.password_hash <> extensions.crypt(target_password, credential.password_hash) then
    raise exception 'Mật khẩu phòng ban không đúng.';
  end if;

  select team_session.*
  into existing_session
  from public.team_sessions team_session
  where team_session.event_id = target_event_id
    and team_session.team_id = target_team.id
    and team_session.session_token = target_session_token
  order by team_session.created_at desc
  limit 1;

  update public.team_sessions
  set
    status = 'revoked',
    is_primary = false,
    can_control = false,
    revoked_at = coalesce(team_sessions.revoked_at, now())
  where team_sessions.event_id = target_event_id
    and team_sessions.team_id = target_team.id
    and team_sessions.status = 'active'
    and team_sessions.session_token is distinct from target_session_token;

  if existing_session.id is not null then
    update public.team_sessions
    set
      auth_user_id = null,
      device_label = coalesce(join_team_session.device_label, team_sessions.device_label),
      device_fingerprint = join_team_session.target_session_token,
      session_token = join_team_session.target_session_token,
      is_primary = true,
      can_control = true,
      status = 'active',
      revoked_at = null,
      last_seen_at = now()
    where team_sessions.id = existing_session.id
    returning * into existing_session;
  else
    insert into public.team_sessions (
      event_id,
      team_id,
      auth_user_id,
      device_label,
      device_fingerprint,
      session_token,
      is_primary,
      can_control,
      status,
      last_seen_at
    )
    values (
      target_event_id,
      target_team.id,
      null,
      join_team_session.device_label,
      join_team_session.target_session_token,
      join_team_session.target_session_token,
      true,
      true,
      'active',
      now()
    )
    returning * into existing_session;
  end if;

  return jsonb_build_object(
    'team_code', target_team.team_code,
    'team_name', target_team.display_name,
    'session', jsonb_build_object(
      'id', existing_session.id,
      'team_id', existing_session.team_id,
      'session_token', existing_session.session_token,
      'device_label', existing_session.device_label,
      'device_fingerprint', existing_session.device_fingerprint,
      'status', existing_session.status,
      'can_control', existing_session.can_control,
      'last_seen_at', existing_session.last_seen_at,
      'revoked_at', existing_session.revoked_at,
      'created_at', existing_session.created_at
    )
  );
end;
$$;

create or replace function public.leave_team_session(
  target_event_slug text,
  target_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_session public.team_sessions%rowtype;
begin
  active_session := private.require_team_session(target_event_slug, target_session_token);

  update public.team_sessions
  set
    status = 'revoked',
    is_primary = false,
    can_control = false,
    revoked_at = coalesce(team_sessions.revoked_at, now())
  where id = active_session.id
  returning * into active_session;

  return jsonb_build_object(
    'session_id', active_session.id,
    'status', active_session.status
  );
end;
$$;

create or replace function public.get_team_live_snapshot(
  target_event_slug text,
  target_team_code text,
  target_device_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_session public.team_sessions%rowtype;
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  target_team public.teams%rowtype;
  phase_snapshot jsonb;
  latest_bet jsonb := null;
  score_snapshot jsonb := null;
  session_snapshot jsonb := null;
  current_question_index integer;
  team_rank integer := null;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  active_session := private.require_team_session(target_event_slug, target_device_fingerprint);

  select team.*
  into target_team
  from public.teams team
  where team.id = active_session.team_id
    and team.event_id = target_event_id
    and team.team_code = target_team_code
  limit 1;

  if target_team.id is null then
    raise exception 'Session is not valid for team route %.', target_team_code;
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  current_question_index := nullif(phase_snapshot ->> 'current_question_index', '')::integer;

  select ranked.rank_position
  into team_rank
  from (
    select
      team_score.team_id,
      rank() over (
        order by
          team_score.total_score desc,
          team_score.round1_tokens desc,
          team.sort_order asc
      )::integer as rank_position
    from public.team_scores team_score
    join public.teams team
      on team.id = team_score.team_id
    where team_score.event_id = target_event_id
  ) ranked
  where ranked.team_id = target_team.id
  limit 1;

  select jsonb_build_object(
    'id', team_score.id,
    'team_id', team_score.team_id,
    'rank', team_rank,
    'round1_tokens', team_score.round1_tokens,
    'round1_score', team_score.round1_score,
    'round2_score', team_score.round2_score,
    'bonus_score', team_score.bonus_score,
    'total_score', team_score.total_score,
    'updated_at', team_score.updated_at
  )
  into score_snapshot
  from public.team_scores team_score
  where team_score.event_id = target_event_id
    and team_score.team_id = target_team.id
  limit 1;

  if current_question_index is not null then
    select jsonb_build_object(
      'id', round1_bet.id,
      'event_id', round1_bet.event_id,
      'team_id', round1_bet.team_id,
      'question_index', round1_bet.question_index,
      'bet_amount', round1_bet.bet_amount,
      'resolution', round1_bet.resolution,
      'submitted_by_session_id', round1_bet.submitted_by_session_id,
      'marked_by_profile_id', round1_bet.marked_by_profile_id,
      'marked_at', round1_bet.marked_at,
      'created_at', round1_bet.created_at,
      'updated_at', round1_bet.updated_at
    )
    into latest_bet
    from public.round1_bets round1_bet
    where round1_bet.event_id = target_event_id
      and round1_bet.team_id = target_team.id
      and round1_bet.question_index = current_question_index
    limit 1;
  end if;

  session_snapshot := jsonb_build_object(
    'id', active_session.id,
    'event_id', active_session.event_id,
    'team_id', active_session.team_id,
    'auth_user_id', active_session.auth_user_id,
    'session_token', active_session.session_token,
    'device_label', active_session.device_label,
    'device_fingerprint', active_session.device_fingerprint,
    'is_primary', active_session.is_primary,
    'can_control', active_session.can_control,
    'status', active_session.status,
    'last_seen_at', active_session.last_seen_at,
    'revoked_at', active_session.revoked_at,
    'created_at', active_session.created_at
  );

  return jsonb_build_object(
    'phase', phase_snapshot,
    'team', jsonb_build_object(
      'team_id', target_team.id,
      'team_code', target_team.team_code,
      'display_name', target_team.display_name
    ),
    'score', score_snapshot,
    'bet', latest_bet,
    'session', session_snapshot
  );
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
  active_session public.team_sessions%rowtype;
  target_team public.teams%rowtype;
  current_state public.game_state%rowtype;
  current_score public.team_scores%rowtype;
  upserted_bet public.round1_bets%rowtype;
  target_event_slug text;
begin
  if target_question_index is null or target_question_index < 0 or target_question_index > 4 then
    raise exception 'Round 1 question index % is invalid.', target_question_index;
  end if;

  if target_bet_amount is null or target_bet_amount < 1 or target_bet_amount > 5 then
    raise exception 'Bet amount must be between 1 and 5.';
  end if;

  if target_device_fingerprint is null or length(trim(target_device_fingerprint)) = 0 then
    raise exception 'Invalid team session.';
  end if;

  select event.slug
  into target_event_slug
  from public.team_sessions team_session
  join public.events event
    on event.id = team_session.event_id
  where team_session.session_token = target_device_fingerprint
  limit 1;

  if target_event_slug is null then
    raise exception 'Invalid team session.';
  end if;

  active_session := private.require_team_session(target_event_slug, target_device_fingerprint);

  if active_session.can_control is not true then
    raise exception 'Only the active team controller can place a live Round 1 bet.';
  end if;

  select team.*
  into target_team
  from public.teams team
  where team.id = active_session.team_id
  limit 1;

  select game_state.*
  into current_state
  from public.game_state game_state
  where game_state.event_id = active_session.event_id
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

  current_score := private.ensure_team_score_row(active_session.event_id, active_session.team_id);

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
    active_session.event_id,
    active_session.team_id,
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

create or replace function public.get_round2_team_snapshot(
  target_event_slug text,
  target_team_code text,
  target_device_fingerprint text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  team_snapshot jsonb := public.get_team_live_snapshot(
    target_event_slug,
    target_team_code,
    target_device_fingerprint
  );
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_team_id uuid := nullif(team_snapshot -> 'phase' ->> 'active_team_id', '')::uuid;
  current_team_id uuid := nullif(team_snapshot -> 'team' ->> 'team_id', '')::uuid;
begin
  return team_snapshot || jsonb_build_object(
    'assigned_case', private.build_round2_case_snapshot(target_event_id, current_team_id),
    'is_active_team', active_team_id is not null and active_team_id = current_team_id,
    'judge_submissions', private.build_round2_submission_summary(target_event_id)
  );
end;
$$;

grant execute on function public.join_team_session(text, text, text, text, text) to anon, authenticated;
grant execute on function public.leave_team_session(text, text) to anon, authenticated;
grant execute on function public.get_team_live_snapshot(text, text, text) to anon, authenticated;
grant execute on function public.get_round2_team_snapshot(text, text, text) to anon, authenticated;
grant execute on function public.submit_round1_bet(integer, integer, text) to anon, authenticated;
