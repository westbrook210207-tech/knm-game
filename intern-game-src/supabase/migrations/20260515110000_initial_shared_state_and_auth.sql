create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'live', 'finished')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_code text not null unique,
  display_name text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.role_profiles (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'judge', 'team')),
  team_id uuid references public.teams(id) on delete set null,
  judge_code text,
  display_name text not null,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.game_state (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  current_phase text not null default 'lobby',
  phase_payload jsonb not null default '{}'::jsonb,
  active_team_id uuid references public.teams(id) on delete set null,
  current_question_index integer,
  phase_version integer not null default 0,
  updated_by_profile_id uuid references public.role_profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.team_sessions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  auth_user_id uuid not null references auth.users(id) on delete cascade,
  device_label text,
  device_fingerprint text,
  is_primary boolean not null default false,
  can_control boolean not null default false,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists team_sessions_one_primary_per_team
  on public.team_sessions(team_id)
  where is_primary = true and status = 'active';

create index if not exists team_sessions_team_id_idx on public.team_sessions(team_id);
create index if not exists role_profiles_event_role_idx on public.role_profiles(event_id, role);

grant usage on schema public to anon, authenticated;
grant select on public.events to anon, authenticated;
grant select on public.teams to anon, authenticated;
grant select, update on public.game_state to authenticated;
grant select on public.game_state to anon;
grant select on public.role_profiles to authenticated;
grant select, insert, update on public.team_sessions to authenticated;

alter table public.events enable row level security;
alter table public.teams enable row level security;
alter table public.role_profiles enable row level security;
alter table public.game_state enable row level security;
alter table public.team_sessions enable row level security;

create policy "events_readable_by_all_clients"
  on public.events
  for select
  using (true);

create policy "teams_readable_by_all_clients"
  on public.teams
  for select
  using (true);

create policy "game_state_readable_by_all_clients"
  on public.game_state
  for select
  using (true);

create policy "role_profiles_select_self_or_admin"
  on public.role_profiles
  for select
  using (
    auth.uid() = auth_user_id
    or exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  );

create policy "team_sessions_select_self_or_admin"
  on public.team_sessions
  for select
  using (
    auth.uid() = auth_user_id
    or exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  );

create policy "admin_can_update_game_state"
  on public.game_state
  for update
  using (
    exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  )
  with check (
    exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  );

create policy "team_session_insert_self_or_admin"
  on public.team_sessions
  for insert
  with check (
    auth.uid() = auth_user_id
    or exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  );

create policy "team_session_update_self_or_admin"
  on public.team_sessions
  for update
  using (
    auth.uid() = auth_user_id
    or exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  )
  with check (
    auth.uid() = auth_user_id
    or exists (
      select 1
      from public.role_profiles admin_profile
      where admin_profile.auth_user_id = auth.uid()
        and admin_profile.role = 'admin'
        and admin_profile.is_enabled = true
    )
  );

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists game_state_set_updated_at on public.game_state;
create trigger game_state_set_updated_at
before update on public.game_state
for each row execute function public.set_updated_at();

insert into public.events (slug, name, status)
values ('ueh-softskills-2026', 'UEH Soft Skills 2026', 'draft')
on conflict (slug) do nothing;

with target_event as (
  select id
  from public.events
  where slug = 'ueh-softskills-2026'
)
insert into public.teams (event_id, team_code, display_name, icon, sort_order)
select
  target_event.id,
  seed.team_code,
  seed.display_name,
  seed.icon,
  seed.sort_order
from target_event
cross join (
  values
    ('finance', 'Phòng Tài Chính', '💰', 1),
    ('business', 'Phòng Kinh Doanh', '📊', 2),
    ('marketing', 'Phòng Marketing', '📣', 3),
    ('logistics', 'Phòng Logistics', '🚚', 4),
    ('it', 'Phòng CNTT', '💻', 5),
    ('accounting', 'Phòng Kế Toán', '🗂️', 6),
    ('legal', 'Phòng Pháp Chế', '⚖️', 7),
    ('media', 'Phòng Truyền Thông', '📡', 8),
    ('trade', 'Phòng Ngoại Thương', '🌏', 9)
) as seed(team_code, display_name, icon, sort_order)
on conflict (team_code) do update
set
  display_name = excluded.display_name,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.game_state (
  event_id,
  current_phase,
  phase_payload,
  active_team_id,
  current_question_index,
  phase_version
)
select
  target_event.id,
  'lobby',
  jsonb_build_object(
    'label', 'Lobby',
    'source', 'migration-seed'
  ),
  null,
  null,
  0
from public.events target_event
where target_event.slug = 'ueh-softskills-2026'
on conflict (event_id) do update
set
  current_phase = excluded.current_phase,
  phase_payload = excluded.phase_payload;
