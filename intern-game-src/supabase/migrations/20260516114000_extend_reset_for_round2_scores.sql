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
