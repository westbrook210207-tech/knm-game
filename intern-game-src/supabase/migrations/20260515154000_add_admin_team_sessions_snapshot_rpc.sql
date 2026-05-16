create or replace function public.get_admin_team_sessions_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
begin
  select rp.role
    into current_role
  from public.role_profiles rp
  where rp.auth_user_id = auth.uid()
  limit 1;

  if current_role is distinct from 'admin' then
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
          'created_at', ts.created_at,
          'updated_at', ts.updated_at,
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
    ),
    '[]'::jsonb
  );
end;
$$;

grant execute on function public.get_admin_team_sessions_snapshot() to authenticated;
