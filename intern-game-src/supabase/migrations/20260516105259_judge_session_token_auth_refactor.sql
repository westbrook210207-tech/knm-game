create table if not exists private.judge_access_credentials (
  judge_profile_id uuid primary key references public.role_profiles(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  judge_code text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, judge_code)
);

create index if not exists judge_access_credentials_event_id_idx
  on private.judge_access_credentials(event_id);

drop trigger if exists set_judge_access_credentials_updated_at on private.judge_access_credentials;
create trigger set_judge_access_credentials_updated_at
before update on private.judge_access_credentials
for each row
execute function public.set_updated_at();

create table if not exists public.judge_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  judge_profile_id uuid not null references public.role_profiles(id) on delete cascade,
  judge_code text not null,
  device_label text,
  session_token text not null,
  status text not null default 'active' check (status in ('active', 'revoked')),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_token)
);

create index if not exists judge_sessions_event_judge_idx
  on public.judge_sessions(event_id, judge_profile_id);

create unique index if not exists judge_sessions_single_active_judge_idx
  on public.judge_sessions(event_id, judge_profile_id)
  where status = 'active';

drop trigger if exists set_judge_sessions_updated_at on public.judge_sessions;
create trigger set_judge_sessions_updated_at
before update on public.judge_sessions
for each row
execute function public.set_updated_at();

alter table public.judge_sessions enable row level security;

insert into private.judge_access_credentials (
  judge_profile_id,
  event_id,
  judge_code,
  password_hash
)
select
  role_profile.id,
  role_profile.event_id,
  role_profile.judge_code,
  extensions.crypt('TempPass123!', extensions.gen_salt('bf'))
from public.role_profiles role_profile
where role_profile.role = 'judge'
  and role_profile.is_enabled = true
  and role_profile.judge_code is not null
on conflict (judge_profile_id) do update
set
  judge_code = excluded.judge_code,
  event_id = excluded.event_id;

create or replace function private.get_judge_access_credential(
  target_event_id uuid,
  target_judge_code text
)
returns private.judge_access_credentials
language plpgsql
security definer
set search_path = ''
as $$
declare
  credential private.judge_access_credentials%rowtype;
begin
  select judge_access_credential.*
  into credential
  from private.judge_access_credentials judge_access_credential
  where judge_access_credential.event_id = target_event_id
    and judge_access_credential.judge_code = target_judge_code
  limit 1;

  return credential;
end;
$$;

create or replace function private.require_judge_session(
  target_event_slug text,
  target_judge_code text,
  target_session_token text
)
returns public.judge_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_session public.judge_sessions%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if target_judge_code is null or length(trim(target_judge_code)) = 0 then
    raise exception 'Invalid judge session.';
  end if;

  if target_session_token is null or length(trim(target_session_token)) = 0 then
    raise exception 'Invalid judge session.';
  end if;

  select judge_session.*
  into active_session
  from public.judge_sessions judge_session
  where judge_session.event_id = target_event_id
    and judge_session.judge_code = target_judge_code
    and judge_session.session_token = target_session_token
    and judge_session.status = 'active'
  order by judge_session.created_at desc
  limit 1;

  if active_session.id is null then
    raise exception 'Invalid judge session.';
  end if;

  update public.judge_sessions
  set last_seen_at = now()
  where id = active_session.id;

  select judge_session.*
  into active_session
  from public.judge_sessions judge_session
  where judge_session.id = active_session.id
  limit 1;

  return active_session;
end;
$$;

create or replace function public.join_judge_session(
  target_event_slug text,
  target_judge_code text,
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
  judge_profile public.role_profiles%rowtype;
  credential private.judge_access_credentials%rowtype;
  existing_session public.judge_sessions%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if target_judge_code is null or length(trim(target_judge_code)) = 0 then
    raise exception 'Judge code is required.';
  end if;

  if target_password is null or length(target_password) = 0 then
    raise exception 'Mật khẩu giám khảo là bắt buộc.';
  end if;

  if target_session_token is null or length(trim(target_session_token)) = 0 then
    raise exception 'Session token is required.';
  end if;

  select role_profile.*
  into judge_profile
  from public.role_profiles role_profile
  where role_profile.event_id = target_event_id
    and role_profile.role = 'judge'
    and role_profile.is_enabled = true
    and role_profile.judge_code = target_judge_code
  limit 1;

  if judge_profile.id is null then
    raise exception 'Judge route % does not exist for this event.', target_judge_code;
  end if;

  credential := private.get_judge_access_credential(target_event_id, target_judge_code);

  if credential.judge_profile_id is null
    or credential.password_hash <> extensions.crypt(target_password, credential.password_hash) then
    raise exception 'Mật khẩu giám khảo không đúng.';
  end if;

  select judge_session.*
  into existing_session
  from public.judge_sessions judge_session
  where judge_session.event_id = target_event_id
    and judge_session.judge_profile_id = judge_profile.id
    and judge_session.session_token = target_session_token
  order by judge_session.created_at desc
  limit 1;

  update public.judge_sessions
  set
    status = 'revoked',
    revoked_at = coalesce(judge_sessions.revoked_at, now())
  where judge_sessions.event_id = target_event_id
    and judge_sessions.judge_profile_id = judge_profile.id
    and judge_sessions.status = 'active'
    and judge_sessions.session_token is distinct from target_session_token;

  if existing_session.id is not null then
    update public.judge_sessions
    set
      judge_code = judge_profile.judge_code,
      device_label = coalesce(join_judge_session.device_label, judge_sessions.device_label),
      session_token = join_judge_session.target_session_token,
      status = 'active',
      revoked_at = null,
      last_seen_at = now()
    where judge_sessions.id = existing_session.id
    returning * into existing_session;
  else
    insert into public.judge_sessions (
      event_id,
      judge_profile_id,
      judge_code,
      device_label,
      session_token,
      status,
      last_seen_at
    )
    values (
      target_event_id,
      judge_profile.id,
      judge_profile.judge_code,
      join_judge_session.device_label,
      join_judge_session.target_session_token,
      'active',
      now()
    )
    returning * into existing_session;
  end if;

  return jsonb_build_object(
    'judge_code', judge_profile.judge_code,
    'judge_name', judge_profile.display_name,
    'session', jsonb_build_object(
      'id', existing_session.id,
      'judge_profile_id', existing_session.judge_profile_id,
      'judge_code', existing_session.judge_code,
      'session_token', existing_session.session_token,
      'device_label', existing_session.device_label,
      'status', existing_session.status,
      'last_seen_at', existing_session.last_seen_at,
      'revoked_at', existing_session.revoked_at,
      'created_at', existing_session.created_at
    )
  );
end;
$$;

create or replace function public.leave_judge_session(
  target_event_slug text,
  target_judge_code text,
  target_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_session public.judge_sessions%rowtype;
begin
  active_session := private.require_judge_session(
    target_event_slug,
    target_judge_code,
    target_session_token
  );

  update public.judge_sessions
  set
    status = 'revoked',
    revoked_at = now()
  where id = active_session.id
  returning * into active_session;

  return jsonb_build_object(
    'judge_code', active_session.judge_code,
    'session', jsonb_build_object(
      'id', active_session.id,
      'judge_profile_id', active_session.judge_profile_id,
      'judge_code', active_session.judge_code,
      'session_token', active_session.session_token,
      'device_label', active_session.device_label,
      'status', active_session.status,
      'last_seen_at', active_session.last_seen_at,
      'revoked_at', active_session.revoked_at,
      'created_at', active_session.created_at
    )
  );
end;
$$;

create or replace function public.get_round2_judge_session_snapshot(
  target_event_slug text,
  target_judge_code text,
  target_session_token text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_session public.judge_sessions%rowtype;
  phase_snapshot jsonb;
  judge_profile public.role_profiles%rowtype;
  active_team_id uuid;
  active_case jsonb := null;
  judge_submission jsonb := null;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  active_session := private.require_judge_session(
    target_event_slug,
    target_judge_code,
    target_session_token
  );

  select role_profile.*
  into judge_profile
  from public.role_profiles role_profile
  where role_profile.id = active_session.judge_profile_id
    and role_profile.event_id = target_event_id
    and role_profile.role = 'judge'
    and role_profile.is_enabled = true
  limit 1;

  if judge_profile.id is null then
    raise exception 'Invalid judge session.';
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  active_team_id := nullif(phase_snapshot ->> 'active_team_id', '')::uuid;

  if active_team_id is not null then
    active_case := private.build_round2_case_snapshot(target_event_id, active_team_id);

    select jsonb_build_object(
      'team_id', round2_judge_score.team_id,
      'analysis_score', round2_judge_score.analysis_score,
      'strategy_score', round2_judge_score.strategy_score,
      'delivery_score', round2_judge_score.delivery_score,
      'total_score', round2_judge_score.total_score,
      'notes', round2_judge_score.notes,
      'updated_at', round2_judge_score.updated_at
    )
    into judge_submission
    from public.round2_judge_scores round2_judge_score
    where round2_judge_score.event_id = target_event_id
      and round2_judge_score.team_id = active_team_id
      and round2_judge_score.judge_profile_id = judge_profile.id
    limit 1;
  end if;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'judge', jsonb_build_object(
      'judge_code', judge_profile.judge_code,
      'display_name', judge_profile.display_name,
      'profile_id', judge_profile.id
    ),
    'session', jsonb_build_object(
      'id', active_session.id,
      'judge_code', active_session.judge_code,
      'device_label', active_session.device_label,
      'status', active_session.status,
      'last_seen_at', active_session.last_seen_at,
      'revoked_at', active_session.revoked_at
    ),
    'active_case', active_case,
    'current_submission', judge_submission,
    'judge_submissions', private.build_round2_submission_summary(target_event_id)
  );
end;
$$;

create or replace function public.submit_round2_judge_score_session(
  target_event_slug text,
  target_judge_code text,
  target_session_token text,
  target_team_code text default null,
  target_analysis_score integer default 0,
  target_strategy_score integer default 0,
  target_delivery_score integer default 0,
  target_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  active_session public.judge_sessions%rowtype;
  judge_profile public.role_profiles%rowtype;
  target_team_id uuid;
  current_state public.game_state%rowtype;
  current_stage text;
  submission_count integer;
  average_score numeric(5,2);
  finalized_score integer;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  active_session := private.require_judge_session(
    target_event_slug,
    target_judge_code,
    target_session_token
  );

  select role_profile.*
  into judge_profile
  from public.role_profiles role_profile
  where role_profile.id = active_session.judge_profile_id
    and role_profile.event_id = target_event_id
    and role_profile.role = 'judge'
    and role_profile.is_enabled = true
  limit 1;

  if judge_profile.id is null then
    raise exception 'Invalid judge session.';
  end if;

  select * into current_state
  from public.game_state
  where event_id = target_event_id
  limit 1;

  current_stage := coalesce(current_state.phase_payload ->> 'stage', '');

  if current_stage <> 'round2_presentation' then
    raise exception 'Judge chỉ được chấm khi Round 2 đang ở phase presentation.';
  end if;

  if target_team_code is not null then
    select id into target_team_id
    from public.teams
    where event_id = target_event_id
      and team_code = target_team_code
    limit 1;
  else
    target_team_id := current_state.active_team_id;
  end if;

  if target_team_id is null then
    raise exception 'No active Round 2 team is currently selected.';
  end if;

  if target_team_id <> current_state.active_team_id then
    raise exception 'Judge chỉ được chấm đúng đội đang active.';
  end if;

  insert into public.round2_judge_scores (
    event_id,
    team_id,
    judge_profile_id,
    analysis_score,
    strategy_score,
    delivery_score,
    notes
  )
  values (
    target_event_id,
    target_team_id,
    judge_profile.id,
    target_analysis_score,
    target_strategy_score,
    target_delivery_score,
    target_notes
  )
  on conflict (event_id, team_id, judge_profile_id) do update
  set
    analysis_score = excluded.analysis_score,
    strategy_score = excluded.strategy_score,
    delivery_score = excluded.delivery_score,
    notes = excluded.notes,
    updated_at = now();

  select
    count(*)::integer,
    coalesce(avg(round2_judge_score.total_score), 0)::numeric(5,2),
    case
      when count(*) >= 3 then floor(avg(round2_judge_score.total_score))::integer
      else null
    end
  into submission_count, average_score, finalized_score
  from public.round2_judge_scores round2_judge_score
  where round2_judge_score.event_id = target_event_id
    and round2_judge_score.team_id = target_team_id;

  insert into public.round2_results (
    event_id,
    team_id,
    submission_count,
    average_score,
    final_score,
    is_finalized,
    is_published,
    updated_at
  )
  values (
    target_event_id,
    target_team_id,
    submission_count,
    average_score,
    finalized_score,
    submission_count >= 3,
    false,
    now()
  )
  on conflict (event_id, team_id) do update
  set
    submission_count = excluded.submission_count,
    average_score = excluded.average_score,
    final_score = excluded.final_score,
    is_finalized = excluded.is_finalized,
    updated_at = now();

  return public.get_round2_judge_session_snapshot(
    target_event_slug,
    judge_profile.judge_code,
    target_session_token
  );
end;
$$;

grant execute on function public.join_judge_session(text, text, text, text, text) to anon, authenticated;
grant execute on function public.leave_judge_session(text, text, text) to anon, authenticated;
grant execute on function public.get_round2_judge_session_snapshot(text, text, text) to anon, authenticated;
grant execute on function public.submit_round2_judge_score_session(text, text, text, text, integer, integer, integer, text) to anon, authenticated;
