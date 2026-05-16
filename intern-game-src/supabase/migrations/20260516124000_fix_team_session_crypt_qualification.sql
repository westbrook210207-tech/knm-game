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
