import { requireSupabaseClient } from './supabase/client';
import { getSupabaseEnv } from './supabase/env';

export const LIVE_REFRESH_INTERVAL_MS = 5000;
export const ACTIVE_ROUND_REFRESH_INTERVAL_MS = 1000;

export function getSnapshotRefreshInterval(phaseLike) {
  const currentPhase =
    phaseLike?.current_phase ||
    (phaseLike?.isRound1 ? 'round1' : null);
  const stage = phaseLike?.phase_payload?.stage || phaseLike?.stage || '';

  if (
    (
      currentPhase === 'round1' &&
      ['betting', 'locked', 'reveal'].includes(stage)
    ) ||
    (
      currentPhase === 'round2' &&
      [
        'round2_case_draw',
        'round2_discussion',
        'round2_presentation',
      ].includes(stage)
    )
  ) {
    return ACTIVE_ROUND_REFRESH_INTERVAL_MS;
  }

  return LIVE_REFRESH_INTERVAL_MS;
}

function requireEventSlug() {
  const { eventSlug } = getSupabaseEnv();
  return eventSlug;
}

export async function getSharedPhaseSnapshot() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_shared_phase_snapshot', {
    target_event_slug: requireEventSlug(),
  });

  if (error) throw error;
  return data;
}

export async function getPresenterSnapshot() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_presenter_snapshot', {
    target_event_slug: requireEventSlug(),
  });

  if (error) throw error;
  return data;
}

export async function getAdminRound1Snapshot(questionIndex = null) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_admin_round1_snapshot', {
    target_event_slug: requireEventSlug(),
    target_question_index: questionIndex,
  });

  if (error) throw error;
  return data;
}

export async function getAdminControlSnapshot() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_admin_control_snapshot', {
    target_event_slug: requireEventSlug(),
  });

  if (error) throw error;
  return data;
}

export async function adminSetSharedPhase(nextPhase, phasePayload = {}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_set_shared_phase', {
    target_event_slug: requireEventSlug(),
    next_phase: nextPhase,
    next_phase_payload: phasePayload,
  });

  if (error) throw error;
  return data;
}

export async function getTeamLiveSnapshot({ teamCode, sessionToken = null }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_team_live_snapshot', {
    target_event_slug: requireEventSlug(),
    target_team_code: teamCode,
    target_device_fingerprint: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function getRound2PresenterSnapshot() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_round2_presenter_snapshot', {
    target_event_slug: requireEventSlug(),
  });

  if (error) throw error;
  return data;
}

export async function getRound2TeamSnapshot({ teamCode, sessionToken = null }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_round2_team_snapshot', {
    target_event_slug: requireEventSlug(),
    target_team_code: teamCode,
    target_device_fingerprint: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function getRound2JudgeSnapshot({ judgeCode, sessionToken }) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_round2_judge_session_snapshot', {
    target_event_slug: requireEventSlug(),
    target_judge_code: judgeCode,
    target_session_token: sessionToken,
  });

  if (error) throw error;
  return data;
}

export async function getAdminRound2Snapshot() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('get_admin_round2_snapshot', {
    target_event_slug: requireEventSlug(),
  });

  if (error) throw error;
  return data;
}
