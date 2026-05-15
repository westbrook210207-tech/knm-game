create or replace function public.claim_team_session(
  target_team_code text,
  device_label text default null,
  device_fingerprint text default null
)
returns public.team_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  team_profile public.role_profiles%rowtype;
  existing_session public.team_sessions%rowtype;
  should_be_primary boolean;
begin
  if current_user_id is null then
    raise exception 'Authentication required to claim a team session.';
  end if;

  select role_profile.*
  into team_profile
  from public.role_profiles as role_profile
  join public.teams as team
    on team.id = role_profile.team_id
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'team'
    and role_profile.is_enabled = true
    and team.team_code = target_team_code
  limit 1;

  if team_profile.id is null then
    raise exception 'Signed-in user does not have access to team route %.', target_team_code;
  end if;

  if device_fingerprint is not null then
    select team_session.*
    into existing_session
    from public.team_sessions as team_session
    where team_session.event_id = team_profile.event_id
      and team_session.team_id = team_profile.team_id
      and team_session.auth_user_id = current_user_id
      and team_session.device_fingerprint = device_fingerprint
    order by team_session.created_at desc
    limit 1;
  end if;

  if existing_session.id is not null then
    update public.team_sessions
    set
      device_label = coalesce(claim_team_session.device_label, team_sessions.device_label),
      last_seen_at = now()
    where team_sessions.id = existing_session.id
    returning * into existing_session;

    return existing_session;
  end if;

  select not exists (
    select 1
    from public.team_sessions as team_session
    where team_session.event_id = team_profile.event_id
      and team_session.team_id = team_profile.team_id
      and team_session.is_primary = true
      and team_session.status = 'active'
  )
  into should_be_primary;

  insert into public.team_sessions (
    event_id,
    team_id,
    auth_user_id,
    device_label,
    device_fingerprint,
    is_primary,
    can_control,
    status,
    last_seen_at
  )
  values (
    team_profile.event_id,
    team_profile.team_id,
    current_user_id,
    device_label,
    device_fingerprint,
    should_be_primary,
    should_be_primary,
    'active',
    now()
  )
  returning * into existing_session;

  return existing_session;
end;
$$;

grant execute on function public.claim_team_session(text, text, text) to authenticated;
