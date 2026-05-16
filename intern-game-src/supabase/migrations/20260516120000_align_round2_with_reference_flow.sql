create table if not exists public.round2_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  submission_count integer not null default 0 check (submission_count >= 0 and submission_count <= 3),
  average_score numeric(5,2) not null default 0,
  final_score integer,
  is_finalized boolean not null default false,
  is_published boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (event_id, team_id)
);

create index if not exists round2_results_event_team_idx
  on public.round2_results(event_id, team_id);

alter table public.round2_results enable row level security;

alter table public.round2_judge_scores
  drop constraint if exists round2_judge_scores_analysis_score_check;

alter table public.round2_judge_scores
  drop constraint if exists round2_judge_scores_strategy_score_check;

alter table public.round2_judge_scores
  drop constraint if exists round2_judge_scores_delivery_score_check;

alter table public.round2_judge_scores
  add constraint round2_judge_scores_analysis_score_check
  check (analysis_score between 0 and 2);

alter table public.round2_judge_scores
  add constraint round2_judge_scores_strategy_score_check
  check (strategy_score between 0 and 2);

alter table public.round2_judge_scores
  add constraint round2_judge_scores_delivery_score_check
  check (delivery_score between 0 and 1);

create or replace function private.build_round2_submission_summary(
  target_event_id uuid
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'team_id', team.id,
        'team_code', team.team_code,
        'display_name', team.display_name,
        'icon', team.icon,
        'submission_count', coalesce(round2_result.submission_count, 0),
        'average_score', coalesce(round2_result.average_score, 0),
        'final_score', round2_result.final_score,
        'is_finalized', coalesce(round2_result.is_finalized, false),
        'is_published', coalesce(round2_result.is_published, false),
        'published_round2_score', coalesce(team_score.round2_score, 0)
      )
      order by team.sort_order asc
    ),
    '[]'::jsonb
  )
  from public.teams team
  left join public.round2_results round2_result
    on round2_result.event_id = target_event_id
   and round2_result.team_id = team.id
  left join public.team_scores team_score
    on team_score.event_id = target_event_id
   and team_score.team_id = team.id
  where team.event_id = target_event_id;
$$;

create or replace function public.admin_activate_round2_team(
  target_event_slug text,
  target_team_code text,
  target_stage text default 'round2_presentation',
  target_countdown_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  target_team public.teams%rowtype;
  next_phase_payload jsonb := jsonb_build_object(
    'label', 'Round 2',
    'round', 'round2',
    'stage', target_stage,
    'activeTeamCode', target_team_code,
    'source', 'admin-round2'
  );
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can activate a Round 2 team.';
  end if;

  select * into target_team
  from public.teams
  where event_id = target_event_id
    and team_code = target_team_code
  limit 1;

  if target_team.id is null then
    raise exception 'Team code % does not exist for Round 2.', target_team_code;
  end if;

  if target_countdown_seconds is not null and target_countdown_seconds > 0 then
    next_phase_payload := next_phase_payload || jsonb_build_object(
      'countdownSeconds', target_countdown_seconds,
      'countdownEndsAt', to_jsonb((now() + make_interval(secs => target_countdown_seconds)) at time zone 'utc')
    );
  else
    next_phase_payload := next_phase_payload - 'countdownSeconds' - 'countdownEndsAt';
  end if;

  update public.game_state
  set
    current_phase = 'round2',
    phase_payload = next_phase_payload,
    active_team_id = target_team.id,
    phase_version = phase_version + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where event_id = target_event_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

create or replace function public.admin_set_round2_stage(
  target_event_slug text,
  target_stage text,
  target_countdown_seconds integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  current_state public.game_state%rowtype;
  next_payload jsonb;
  active_team_code text := null;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can update Round 2 stage.';
  end if;

  select * into current_state
  from public.game_state
  where event_id = target_event_id
  limit 1;

  if current_state.active_team_id is not null then
    select team_code into active_team_code
    from public.teams
    where id = current_state.active_team_id
    limit 1;
  end if;

  next_payload := coalesce(current_state.phase_payload, '{}'::jsonb) || jsonb_build_object(
    'label', 'Round 2',
    'round', 'round2',
    'stage', target_stage,
    'activeTeamCode', active_team_code,
    'source', 'admin-round2'
  );

  if target_countdown_seconds is not null and target_countdown_seconds > 0 then
    next_payload := next_payload || jsonb_build_object(
      'countdownSeconds', target_countdown_seconds,
      'countdownEndsAt', to_jsonb((now() + make_interval(secs => target_countdown_seconds)) at time zone 'utc')
    );
  else
    next_payload := next_payload - 'countdownSeconds' - 'countdownEndsAt';
  end if;

  update public.game_state
  set
    current_phase = 'round2',
    phase_payload = next_payload,
    phase_version = phase_version + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where event_id = target_event_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

create or replace function public.submit_round2_judge_score(
  target_event_slug text,
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

  select * into judge_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'judge'
    and is_enabled = true
  limit 1;

  if judge_profile.id is null then
    raise exception 'Only judges can submit Round 2 scores.';
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

  return public.get_round2_judge_snapshot(target_event_slug, judge_profile.judge_code);
end;
$$;

create or replace function public.admin_publish_round2_result(
  target_event_slug text,
  target_team_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  target_team_id uuid;
  current_state public.game_state%rowtype;
  result_row public.round2_results%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can publish Round 2 results.';
  end if;

  if target_team_code is not null then
    select id into target_team_id
    from public.teams
    where event_id = target_event_id
      and team_code = target_team_code
    limit 1;
  else
    select * into current_state
    from public.game_state
    where event_id = target_event_id
    limit 1;

    target_team_id := current_state.active_team_id;
  end if;

  if target_team_id is null then
    raise exception 'No active Round 2 team is currently selected.';
  end if;

  select * into result_row
  from public.round2_results
  where event_id = target_event_id
    and team_id = target_team_id
  limit 1;

  if result_row.id is null or not result_row.is_finalized then
    raise exception 'Round 2 result của đội này chưa được finalize đủ 3 BGK.';
  end if;

  update public.round2_results
  set
    is_published = true,
    updated_at = now()
  where id = result_row.id;

  update public.team_scores
  set
    round2_score = coalesce(result_row.final_score, 0),
    updated_at = now()
  where event_id = target_event_id
    and team_id = target_team_id;

  return public.get_admin_round2_snapshot(target_event_slug);
end;
$$;

create or replace function public.admin_reset_gameplay_state(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select * into admin_profile
  from public.role_profiles
  where auth_user_id = auth.uid()
    and event_id = target_event_id
    and role = 'admin'
    and is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can reset gameplay state.';
  end if;

  update public.team_sessions
  set
    status = 'revoked',
    is_primary = false,
    can_control = false,
    revoked_at = now(),
    last_seen_at = now()
  where event_id = target_event_id
    and status = 'active';

  delete from public.round2_judge_scores
  where event_id = target_event_id;

  delete from public.round2_results
  where event_id = target_event_id;

  delete from public.round1_bets
  where event_id = target_event_id;

  update public.team_scores
  set
    round1_tokens = 10,
    round1_score = 3,
    round2_score = 0,
    bonus_score = 0,
    updated_at = now()
  where event_id = target_event_id;

  update public.game_state
  set
    current_phase = 'lobby',
    phase_payload = jsonb_build_object(
      'label', 'Lobby',
      'round', 'lobby',
      'stage', 'idle',
      'source', 'admin-reset'
    ),
    active_team_id = null,
    current_question_index = null,
    phase_version = phase_version + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where event_id = target_event_id;

  return public.get_admin_control_snapshot(target_event_slug);
end;
$$;
