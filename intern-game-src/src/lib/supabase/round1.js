import { requireSupabaseClient } from './client';

export const ROUND1_LIVE_STAGES = {
  BETTING: 'betting',
  LOCKED: 'locked',
  REVEAL: 'reveal',
  COMPLETE: 'complete',
};

export function getRound1LiveState(phase) {
  const payload = phase?.phase_payload || {};

  return {
    isRound1: phase?.current_phase === 'round1',
    stage: payload.stage || '',
    questionIndex:
      typeof phase?.current_question_index === 'number'
        ? phase.current_question_index
        : typeof payload.questionIndex === 'number'
          ? payload.questionIndex
          : null,
    correctOption: payload.correctOption || null,
    label: payload.label || 'Round 1',
    countdownSeconds:
      typeof payload.countdownSeconds === 'number' ? payload.countdownSeconds : null,
    countdownEndsAt: payload.countdownEndsAt || null,
  };
}

export async function adminSetRound1State({
  questionIndex,
  stage,
  revealCorrectOption = null,
  countdownSeconds = null,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_set_round1_state', {
    target_question_index: questionIndex,
    target_stage: stage,
    reveal_correct_option: revealCorrectOption,
    target_countdown_seconds: countdownSeconds,
  });

  if (error) throw error;
  return data;
}

export async function submitRound1Bet({
  questionIndex,
  betAmount,
  sessionToken,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('submit_round1_bet', {
    target_question_index: questionIndex,
    target_bet_amount: betAmount,
    target_device_fingerprint: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function adminMarkRound1Bet({
  teamCode,
  questionIndex,
  resolution,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_mark_round1_bet', {
    target_team_code: teamCode,
    target_question_index: questionIndex,
    target_resolution: resolution,
  });

  if (error) throw error;
  return data;
}

export async function adminResetGameplayState(targetEventSlug) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_reset_gameplay_state', {
    target_event_slug: targetEventSlug,
  });

  if (error) throw error;
  return data;
}
