create or replace function private.build_admin_team_sessions_snapshot(target_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', team_session.id,
        'team_id', team_session.team_id,
        'auth_user_id', team_session.auth_user_id,
        'device_label', team_session.device_label,
        'device_fingerprint', team_session.device_fingerprint,
        'is_primary', team_session.is_primary,
        'can_control', team_session.can_control,
        'status', team_session.status,
        'last_seen_at', team_session.last_seen_at,
        'created_at', team_session.created_at,
        'revoked_at', team_session.revoked_at,
        'teams', jsonb_build_object(
          'team_code', team.team_code,
          'display_name', team.display_name,
          'icon', team.icon,
          'sort_order', team.sort_order
        )
      )
      order by team_session.created_at desc
    ),
    '[]'::jsonb
  )
  from public.team_sessions team_session
  join public.teams team
    on team.id = team_session.team_id
  where team_session.event_id = target_event_id;
$$;

create or replace function public.get_admin_team_sessions_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  admin_event_id uuid;
begin
  select role_profile.event_id
    into admin_event_id
  from public.role_profiles role_profile
  where role_profile.auth_user_id = (select auth.uid())
    and role_profile.role = 'admin'
    and role_profile.is_enabled = true
  limit 1;

  if admin_event_id is null then
    raise exception 'Only admin can read team sessions snapshot';
  end if;

  return private.build_admin_team_sessions_snapshot(admin_event_id);
end;
$$;

create or replace function public.get_admin_control_snapshot(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  phase_snapshot jsonb;
  current_question_index integer;
  top_team jsonb;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if not private.is_event_admin(target_event_id) then
    raise exception 'Only admin can request the control snapshot.';
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  current_question_index := nullif(phase_snapshot ->> 'current_question_index', '')::integer;

  select entry
    into top_team
  from jsonb_array_elements(private.build_leaderboard_snapshot(target_event_id)) entry
  limit 1;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'leaderboard', private.build_leaderboard_snapshot(target_event_id),
    'sessions', private.build_admin_team_sessions_snapshot(target_event_id),
    'summary', jsonb_build_object(
      'eventSlug', target_event_slug,
      'currentQuestionIndex', current_question_index,
      'currentStage', coalesce(phase_snapshot -> 'phase_payload' ->> 'stage', 'idle'),
      'activeSessionCount', (
        select count(*)
        from public.team_sessions team_session
        where team_session.event_id = target_event_id
          and team_session.status = 'active'
      ),
      'revokedSessionCount', (
        select count(*)
        from public.team_sessions team_session
        where team_session.event_id = target_event_id
          and team_session.status = 'revoked'
      ),
      'betCountForCurrentQuestion', (
        select count(*)
        from public.round1_bets round1_bet
        where round1_bet.event_id = target_event_id
          and current_question_index is not null
          and round1_bet.question_index = current_question_index
      ),
      'resolvedBetCountForCurrentQuestion', (
        select count(*)
        from public.round1_bets round1_bet
        where round1_bet.event_id = target_event_id
          and current_question_index is not null
          and round1_bet.question_index = current_question_index
          and round1_bet.resolution <> 'pending'
      ),
      'teamCount', (
        select count(*)
        from public.teams team
        where team.event_id = target_event_id
      ),
      'topTeam', top_team
    )
  );
end;
$$;

create or replace function public.admin_set_shared_phase(
  target_event_slug text,
  next_phase text,
  next_phase_payload jsonb default '{}'::jsonb
)
returns public.game_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  admin_profile public.role_profiles%rowtype;
  current_state public.game_state%rowtype;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select role_profile.*
    into admin_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = (select auth.uid())
    and role_profile.role = 'admin'
    and role_profile.is_enabled = true
    and role_profile.event_id = target_event_id
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can update the shared phase.';
  end if;

  select game_state.*
    into current_state
  from public.game_state game_state
  where game_state.event_id = target_event_id
  for update;

  if current_state.id is null then
    raise exception 'Shared game_state row is missing for event %.', target_event_slug;
  end if;

  update public.game_state
  set
    current_phase = next_phase,
    phase_payload = coalesce(next_phase_payload, '{}'::jsonb),
    phase_version = coalesce(current_state.phase_version, 0) + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where id = current_state.id
  returning * into current_state;

  return current_state;
end;
$$;

grant execute on function public.get_admin_control_snapshot(text) to authenticated;
grant execute on function public.admin_set_shared_phase(text, text, jsonb) to authenticated;
