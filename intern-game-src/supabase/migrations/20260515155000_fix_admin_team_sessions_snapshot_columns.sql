create or replace function public.get_admin_team_sessions_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.team_sessions team_session
    where private.is_event_admin(team_session.event_id)
    limit 1
  ) then
    raise exception 'Only admin can read team sessions snapshot';
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', ts.id,
          'team_id', ts.team_id,
          'auth_user_id', ts.auth_user_id,
          'device_label', ts.device_label,
          'device_fingerprint', ts.device_fingerprint,
          'is_primary', ts.is_primary,
          'can_control', ts.can_control,
          'status', ts.status,
          'last_seen_at', ts.last_seen_at,
          'created_at', ts.created_at,
          'revoked_at', ts.revoked_at,
          'teams', jsonb_build_object(
            'team_code', t.team_code,
            'display_name', t.display_name
          )
        )
        order by ts.created_at desc
      )
      from public.team_sessions ts
      join public.teams t
        on t.id = ts.team_id
      where private.is_event_admin(ts.event_id)
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_admin_team_sessions_snapshot() to authenticated;
