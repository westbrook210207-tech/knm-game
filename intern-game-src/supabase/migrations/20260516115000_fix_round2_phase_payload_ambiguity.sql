create or replace function public.admin_activate_round2_team(
  target_event_slug text,
  target_team_code text,
  target_stage text default 'discussion',
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
