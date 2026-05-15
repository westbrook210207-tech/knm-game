create schema if not exists private;

create or replace function private.is_event_admin(target_event_id uuid)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.role_profiles role_profile
    where role_profile.auth_user_id = (select auth.uid())
      and role_profile.role = 'admin'
      and role_profile.is_enabled = true
      and role_profile.event_id = target_event_id
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists teams_event_id_idx on public.teams(event_id);
create index if not exists role_profiles_team_id_idx on public.role_profiles(team_id);
create index if not exists team_sessions_event_id_idx on public.team_sessions(event_id);
create index if not exists team_sessions_auth_user_id_idx on public.team_sessions(auth_user_id);
create index if not exists game_state_active_team_id_idx on public.game_state(active_team_id);
create index if not exists game_state_updated_by_profile_id_idx on public.game_state(updated_by_profile_id);

drop policy if exists "role_profiles_select_self_or_admin" on public.role_profiles;
create policy "role_profiles_select_self_or_admin"
  on public.role_profiles
  for select
  using (
    (select auth.uid()) = auth_user_id
    or private.is_event_admin(event_id)
  );

drop policy if exists "team_sessions_select_self_or_admin" on public.team_sessions;
create policy "team_sessions_select_self_or_admin"
  on public.team_sessions
  for select
  using (
    (select auth.uid()) = auth_user_id
    or private.is_event_admin(event_id)
  );

drop policy if exists "admin_can_update_game_state" on public.game_state;
create policy "admin_can_update_game_state"
  on public.game_state
  for update
  using (private.is_event_admin(event_id))
  with check (private.is_event_admin(event_id));

drop policy if exists "team_session_insert_self_or_admin" on public.team_sessions;
create policy "team_session_insert_self_or_admin"
  on public.team_sessions
  for insert
  with check (
    (select auth.uid()) = auth_user_id
    or private.is_event_admin(event_id)
  );

drop policy if exists "team_session_update_self_or_admin" on public.team_sessions;
create policy "team_session_update_self_or_admin"
  on public.team_sessions
  for update
  using (
    (select auth.uid()) = auth_user_id
    or private.is_event_admin(event_id)
  )
  with check (
    (select auth.uid()) = auth_user_id
    or private.is_event_admin(event_id)
  );

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_state'
  ) then
    execute 'alter publication supabase_realtime add table public.game_state';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'team_sessions'
  ) then
    execute 'alter publication supabase_realtime add table public.team_sessions';
  end if;
end
$$;
