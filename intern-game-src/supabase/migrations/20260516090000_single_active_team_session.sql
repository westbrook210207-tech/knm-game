update public.team_sessions
set
  is_primary = false,
  can_control = false
where status <> 'active'
  and (is_primary = true or can_control = true);

with ranked_active_sessions as (
  select
    id,
    row_number() over (
      partition by team_id
      order by created_at desc, id desc
    ) as active_rank
  from public.team_sessions
  where status = 'active'
)
update public.team_sessions team_session
set
  status = 'revoked',
  is_primary = false,
  can_control = false,
  revoked_at = coalesce(team_session.revoked_at, now())
from ranked_active_sessions
where ranked_active_sessions.id = team_session.id
  and ranked_active_sessions.active_rank > 1;

drop index if exists public.team_sessions_one_primary_per_team;

create unique index if not exists team_sessions_one_active_per_team
  on public.team_sessions(team_id)
  where status = 'active';

create or replace function private.claim_team_session_impl(
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

  if claim_team_session_impl.device_fingerprint is not null then
    select team_session.*
    into existing_session
    from public.team_sessions as team_session
    where team_session.event_id = team_profile.event_id
      and team_session.team_id = team_profile.team_id
      and team_session.auth_user_id = current_user_id
      and team_session.device_fingerprint = claim_team_session_impl.device_fingerprint
    order by team_session.created_at desc
    limit 1;
  end if;

  if existing_session.id is not null and existing_session.status = 'active' then
    update public.team_sessions
    set
      device_label = coalesce(claim_team_session_impl.device_label, team_sessions.device_label),
      last_seen_at = now()
    where team_sessions.id = existing_session.id
    returning * into existing_session;

    return existing_session;
  end if;

  update public.team_sessions
  set
    status = 'revoked',
    is_primary = false,
    can_control = false,
    revoked_at = coalesce(team_sessions.revoked_at, now())
  where team_sessions.event_id = team_profile.event_id
    and team_sessions.team_id = team_profile.team_id
    and team_sessions.status = 'active';

  if existing_session.id is not null then
    update public.team_sessions
    set
      auth_user_id = current_user_id,
      device_label = claim_team_session_impl.device_label,
      is_primary = true,
      can_control = true,
      status = 'active',
      revoked_at = null,
      last_seen_at = now()
    where team_sessions.id = existing_session.id
    returning * into existing_session;

    return existing_session;
  end if;

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
    claim_team_session_impl.device_label,
    claim_team_session_impl.device_fingerprint,
    true,
    true,
    'active',
    now()
  )
  returning * into existing_session;

  return existing_session;
end;
$$;
