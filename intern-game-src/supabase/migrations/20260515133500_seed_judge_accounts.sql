do $$
declare
  v_event_id uuid;
begin
  select id into v_event_id
  from public.events
  where slug = 'ueh-softskills-2026';

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
      '33333333-3333-4333-8333-333333333331',
      'authenticated',
      'authenticated',
      'phase004-judge-1@mailinator.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333331',
        'email', 'phase004-judge-1@mailinator.com',
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
      '33333333-3333-4333-8333-333333333332',
      'authenticated',
      'authenticated',
      'phase004-judge-2@mailinator.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333332',
        'email', 'phase004-judge-2@mailinator.com',
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
      '33333333-3333-4333-8333-333333333333',
      'authenticated',
      'authenticated',
      'phase004-judge-3@mailinator.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333333',
        'email', 'phase004-judge-3@mailinator.com',
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
      '44444444-4444-4444-8444-444444444441',
      '33333333-3333-4333-8333-333333333331',
      '33333333-3333-4333-8333-333333333331',
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333331',
        'email', 'phase004-judge-1@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    ),
    (
      '44444444-4444-4444-8444-444444444442',
      '33333333-3333-4333-8333-333333333332',
      '33333333-3333-4333-8333-333333333332',
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333332',
        'email', 'phase004-judge-2@mailinator.com',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    ),
    (
      '44444444-4444-4444-8444-444444444443',
      '33333333-3333-4333-8333-333333333333',
      '33333333-3333-4333-8333-333333333333',
      jsonb_build_object(
        'sub', '33333333-3333-4333-8333-333333333333',
        'email', 'phase004-judge-3@mailinator.com',
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
      '33333333-3333-4333-8333-333333333331',
      'judge',
      null,
      'judge-1',
      'Judge 1',
      true
    ),
    (
      v_event_id,
      '33333333-3333-4333-8333-333333333332',
      'judge',
      null,
      'judge-2',
      'Judge 2',
      true
    ),
    (
      v_event_id,
      '33333333-3333-4333-8333-333333333333',
      'judge',
      null,
      'judge-3',
      'Judge 3',
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
end $$;
