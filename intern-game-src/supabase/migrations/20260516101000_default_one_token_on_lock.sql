create or replace function private.admin_set_round1_state_impl(
  target_question_index integer,
  target_stage text,
  reveal_correct_option text default null,
  target_countdown_seconds integer default null
)
returns public.game_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  admin_profile public.role_profiles%rowtype;
  current_state public.game_state%rowtype;
  next_label text;
  next_payload jsonb;
  effective_countdown_seconds integer;
  countdown_ends_at timestamptz := null;
begin
  if current_user_id is null then
    raise exception 'Authentication required to control Round 1.';
  end if;

  if target_stage not in ('betting', 'locked', 'reveal', 'complete') then
    raise exception 'Round 1 stage % is invalid.', target_stage;
  end if;

  if target_stage <> 'complete' and (target_question_index is null or target_question_index < 0 or target_question_index > 4) then
    raise exception 'Round 1 question index % is invalid.', target_question_index;
  end if;

  if target_countdown_seconds is not null and target_countdown_seconds < 0 then
    raise exception 'Countdown seconds % is invalid.', target_countdown_seconds;
  end if;

  select role_profile.*
  into admin_profile
  from public.role_profiles role_profile
  where role_profile.auth_user_id = current_user_id
    and role_profile.role = 'admin'
    and role_profile.is_enabled = true
  limit 1;

  if admin_profile.id is null then
    raise exception 'Only admin can control Round 1 state.';
  end if;

  select game_state.*
  into current_state
  from public.game_state game_state
  where game_state.event_id = admin_profile.event_id
  for update;

  if current_state.id is null then
    raise exception 'Shared game_state row is missing for this event.';
  end if;

  if target_stage = 'locked' then
    insert into public.round1_bets (
      event_id,
      team_id,
      question_index,
      bet_amount,
      resolution,
      submitted_by_session_id
    )
    select
      team.event_id,
      team.id,
      target_question_index,
      1,
      'pending',
      null
    from public.teams team
    join public.team_scores team_score
      on team_score.event_id = team.event_id
     and team_score.team_id = team.id
    left join public.round1_bets round1_bet
      on round1_bet.event_id = team.event_id
     and round1_bet.team_id = team.id
     and round1_bet.question_index = target_question_index
    where team.event_id = admin_profile.event_id
      and round1_bet.id is null
      and team_score.round1_tokens >= 1;
  end if;

  next_label := case target_stage
    when 'betting' then format('Round 1 - Câu %s - Đặt cược', target_question_index + 1)
    when 'locked' then format('Round 1 - Câu %s - Khóa cược', target_question_index + 1)
    when 'reveal' then format('Round 1 - Câu %s - Công bố đáp án', target_question_index + 1)
    when 'complete' then 'Round 1 - Kết thúc'
    else 'Round 1'
  end;

  effective_countdown_seconds := case
    when target_stage = 'betting' then coalesce(target_countdown_seconds, 15)
    else null
  end;

  if effective_countdown_seconds is not null and effective_countdown_seconds > 0 then
    countdown_ends_at := now() + make_interval(secs => effective_countdown_seconds);
  end if;

  next_payload := jsonb_build_object(
    'round', 'round1',
    'stage', target_stage,
    'label', next_label,
    'source', 'admin-round1',
    'correctOption', reveal_correct_option,
    'questionIndex', target_question_index,
    'countdownSeconds', effective_countdown_seconds,
    'countdownEndsAt', countdown_ends_at
  );

  update public.game_state
  set
    current_phase = 'round1',
    current_question_index = case when target_stage = 'complete' then null else target_question_index end,
    phase_payload = next_payload,
    phase_version = coalesce(current_state.phase_version, 0) + 1,
    updated_by_profile_id = admin_profile.id,
    updated_at = now()
  where id = current_state.id
  returning * into current_state;

  return current_state;
end;
$$;

create or replace function public.admin_set_round1_state(
  target_question_index integer,
  target_stage text,
  reveal_correct_option text default null,
  target_countdown_seconds integer default null
)
returns public.game_state
language sql
set search_path = ''
as $$
  select private.admin_set_round1_state_impl(
    target_question_index,
    target_stage,
    reveal_correct_option,
    target_countdown_seconds
  );
$$;
