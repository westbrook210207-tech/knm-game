create or replace function private.get_event_id_by_slug(target_event_slug text)
returns uuid
language sql
stable
set search_path = ''
as $$
  select event.id
  from public.events event
  where event.slug = target_event_slug
  limit 1;
$$;

create or replace function private.build_shared_phase_snapshot(target_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'id', game_state.id,
    'current_phase', game_state.current_phase,
    'phase_payload', coalesce(game_state.phase_payload, '{}'::jsonb),
    'active_team_id', game_state.active_team_id,
    'current_question_index', game_state.current_question_index,
    'phase_version', coalesce(game_state.phase_version, 0),
    'updated_at', game_state.updated_at
  )
  from public.game_state game_state
  where game_state.event_id = target_event_id
  limit 1;
$$;

create or replace function private.build_leaderboard_snapshot(target_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', team_score.id,
        'team_id', team_score.team_id,
        'round1_tokens', team_score.round1_tokens,
        'round1_score', team_score.round1_score,
        'round2_score', team_score.round2_score,
        'bonus_score', team_score.bonus_score,
        'total_score', team_score.total_score,
        'updated_at', team_score.updated_at,
        'teams', jsonb_build_object(
          'team_code', team.team_code,
          'display_name', team.display_name,
          'icon', team.icon,
          'sort_order', team.sort_order
        )
      )
      order by team_score.total_score desc, team_score.round1_tokens desc, team.sort_order asc
    ),
    '[]'::jsonb
  )
  from public.team_scores team_score
  join public.teams team
    on team.id = team_score.team_id
  where team_score.event_id = target_event_id;
$$;

create or replace function private.build_round1_bets_snapshot(
  target_event_id uuid,
  target_question_index integer default null
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
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
        'updated_at', round1_bet.updated_at,
        'teams', jsonb_build_object(
          'team_code', team.team_code,
          'display_name', team.display_name,
          'icon', team.icon,
          'sort_order', team.sort_order
        )
      )
      order by round1_bet.question_index asc, team.sort_order asc
    ),
    '[]'::jsonb
  )
  from public.round1_bets round1_bet
  join public.teams team
    on team.id = round1_bet.team_id
  where round1_bet.event_id = target_event_id
    and (
      target_question_index is null
      or round1_bet.question_index = target_question_index
    );
$$;

create or replace function public.get_shared_phase_snapshot(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  snapshot jsonb;
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  snapshot := private.build_shared_phase_snapshot(target_event_id);

  if snapshot is null then
    raise exception 'Shared game state is missing for event %.', target_event_slug;
  end if;

  return snapshot;
end;
$$;

create or replace function public.get_presenter_snapshot(target_event_slug text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  return jsonb_build_object(
    'phase', private.build_shared_phase_snapshot(target_event_id),
    'leaderboard', private.build_leaderboard_snapshot(target_event_id)
  );
end;
$$;

create or replace function public.get_admin_round1_snapshot(
  target_event_slug text,
  target_question_index integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
begin
  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  if not private.is_event_admin(target_event_id) then
    raise exception 'Only admin can request the Round 1 admin snapshot.';
  end if;

  return jsonb_build_object(
    'phase', private.build_shared_phase_snapshot(target_event_id),
    'leaderboard', private.build_leaderboard_snapshot(target_event_id),
    'bets', private.build_round1_bets_snapshot(target_event_id, target_question_index)
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
  current_user_id uuid := (select auth.uid());
  target_event_id uuid := private.get_event_id_by_slug(target_event_slug);
  team_profile public.role_profiles%rowtype;
  phase_snapshot jsonb;
  latest_bet jsonb := null;
  score_snapshot jsonb := null;
  session_snapshot jsonb := null;
  current_question_index integer;
begin
  if current_user_id is null then
    raise exception 'Authentication required to request the team snapshot.';
  end if;

  if target_event_id is null then
    raise exception 'Event slug % does not exist.', target_event_slug;
  end if;

  select role_profile.*
  into team_profile
  from public.role_profiles role_profile
  join public.teams team
    on team.id = role_profile.team_id
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'team'
    and role_profile.is_enabled = true
    and role_profile.event_id = target_event_id
    and team.team_code = target_team_code
  limit 1;

  if team_profile.id is null then
    raise exception 'Signed-in user does not have access to team route %.', target_team_code;
  end if;

  phase_snapshot := private.build_shared_phase_snapshot(target_event_id);
  current_question_index := nullif(phase_snapshot ->> 'current_question_index', '')::integer;

  select jsonb_build_object(
    'id', team_score.id,
    'team_id', team_score.team_id,
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
    and team_score.team_id = team_profile.team_id
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
      and round1_bet.team_id = team_profile.team_id
      and round1_bet.question_index = current_question_index
    limit 1;
  end if;

  if target_device_fingerprint is not null then
    select jsonb_build_object(
      'id', team_session.id,
      'event_id', team_session.event_id,
      'team_id', team_session.team_id,
      'auth_user_id', team_session.auth_user_id,
      'device_label', team_session.device_label,
      'device_fingerprint', team_session.device_fingerprint,
      'is_primary', team_session.is_primary,
      'can_control', team_session.can_control,
      'status', team_session.status,
      'last_seen_at', team_session.last_seen_at,
      'revoked_at', team_session.revoked_at,
      'created_at', team_session.created_at
    )
    into session_snapshot
    from public.team_sessions team_session
    where team_session.event_id = target_event_id
      and team_session.team_id = team_profile.team_id
      and team_session.auth_user_id = current_user_id
      and team_session.device_fingerprint = target_device_fingerprint
    order by team_session.created_at desc
    limit 1;
  end if;

  return jsonb_build_object(
    'phase', phase_snapshot,
    'team', jsonb_build_object(
      'role_profile_id', team_profile.id,
      'team_id', team_profile.team_id,
      'team_code', target_team_code,
      'display_name', team_profile.display_name
    ),
    'score', score_snapshot,
    'bet', latest_bet,
    'session', session_snapshot
  );
end;
$$;

grant execute on function public.get_shared_phase_snapshot(text) to anon, authenticated;
grant execute on function public.get_presenter_snapshot(text) to anon, authenticated;
grant execute on function public.get_admin_round1_snapshot(text, integer) to authenticated;
grant execute on function public.get_team_live_snapshot(text, text, text) to authenticated;
