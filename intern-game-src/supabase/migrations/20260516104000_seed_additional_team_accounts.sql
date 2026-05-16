do $$
declare
  v_event_id uuid;
  v_business_team_id uuid;
  v_marketing_team_id uuid;
begin
  select id into v_event_id
  from public.events
  where slug = 'ueh-softskills-2026';

  select id into v_business_team_id
  from public.teams
  where event_id = v_event_id
    and team_code = 'business'
  limit 1;

  select id into v_marketing_team_id
  from public.teams
  where event_id = v_event_id
    and team_code = 'marketing'
  limit 1;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    phone_change,
    phone_change_token,
    is_sso_user,
    is_anonymous
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      '55555555-5555-4555-8555-555555555551',
      'authenticated',
      'authenticated',
      'phase005-team-business@mailinator.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', '55555555-5555-4555-8555-555555555551',
        'email', 'phase005-team-business@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      '55555555-5555-4555-8555-555555555552',
      'authenticated',
      'authenticated',
      'phase005-team-marketing@mailinator.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', '55555555-5555-4555-8555-555555555552',
        'email', 'phase005-team-marketing@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      false,
      false
    )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      '66666666-6666-4666-8666-666666666661',
      '55555555-5555-4555-8555-555555555551',
      '55555555-5555-4555-8555-555555555551',
      jsonb_build_object(
        'sub', '55555555-5555-4555-8555-555555555551',
        'email', 'phase005-team-business@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    ),
    (
      '66666666-6666-4666-8666-666666666662',
      '55555555-5555-4555-8555-555555555552',
      '55555555-5555-4555-8555-555555555552',
      jsonb_build_object(
        'sub', '55555555-5555-4555-8555-555555555552',
        'email', 'phase005-team-marketing@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    )
  on conflict (id) do update
  set
    identity_data = excluded.identity_data,
    updated_at = now();

  insert into public.role_profiles (
    event_id,
    auth_user_id,
    role,
    team_id,
    judge_code,
    display_name,
    is_enabled
  )
  values
    (
      v_event_id,
      '55555555-5555-4555-8555-555555555551',
      'team',
      v_business_team_id,
      null,
      'Business Team Controller',
      true
    ),
    (
      v_event_id,
      '55555555-5555-4555-8555-555555555552',
      'team',
      v_marketing_team_id,
      null,
      'Marketing Team Controller',
      true
    )
  on conflict (auth_user_id) do update
  set
    event_id = excluded.event_id,
    role = excluded.role,
    team_id = excluded.team_id,
    judge_code = excluded.judge_code,
    display_name = excluded.display_name,
    is_enabled = excluded.is_enabled;
end;
$$;
