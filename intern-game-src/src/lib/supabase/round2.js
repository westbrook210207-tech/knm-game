import { requireSupabaseClient } from './client';
import { getSupabaseEnv } from './env';

export const ROUND2_STAGES = {
  CASE_DRAW: 'round2_case_draw',
  DISCUSSION: 'round2_discussion',
  PRESENTATION: 'round2_presentation',
  PUBLISHED: 'round2_published',
};

export function getRound2LiveState(phase) {
  const payload = phase?.phase_payload || {};

  return {
    isRound2: phase?.current_phase === 'round2',
    stage: payload.stage || '',
    label: payload.label || 'Round 2',
    activeTeamCode: payload.activeTeamCode || null,
    countdownSeconds:
      typeof payload.countdownSeconds === 'number' ? payload.countdownSeconds : null,
    countdownEndsAt: payload.countdownEndsAt || null,
  };
}

function requireEventSlug() {
  const { eventSlug } = getSupabaseEnv();
  return eventSlug;
}

export async function adminActivateRound2Team({
  teamCode,
  stage = ROUND2_STAGES.DISCUSSION,
  countdownSeconds = null,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_activate_round2_team', {
    target_event_slug: requireEventSlug(),
    target_team_code: teamCode,
    target_stage: stage,
    target_countdown_seconds: countdownSeconds,
  });

  if (error) throw error;
  return data;
}

export async function adminSetRound2Stage({
  stage,
  countdownSeconds = null,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_set_round2_stage', {
    target_event_slug: requireEventSlug(),
    target_stage: stage,
    target_countdown_seconds: countdownSeconds,
  });

  if (error) throw error;
  return data;
}

export async function submitRound2JudgeScore({
  judgeCode,
  sessionToken,
  teamCode = null,
  analysisScore,
  strategyScore,
  deliveryScore,
  notes = '',
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('submit_round2_judge_score_session', {
    target_event_slug: requireEventSlug(),
    target_judge_code: judgeCode,
    target_session_token: sessionToken,
    target_team_code: teamCode,
    target_analysis_score: analysisScore,
    target_strategy_score: strategyScore,
    target_delivery_score: deliveryScore,
    target_notes: notes,
  });

  if (error) throw error;
  return data;
}

export async function adminPublishRound2Result({ teamCode = null } = {}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_publish_round2_result', {
    target_event_slug: requireEventSlug(),
    target_team_code: teamCode,
  });

  if (error) throw error;
  return data;
}
