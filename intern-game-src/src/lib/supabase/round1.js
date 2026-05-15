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
  };
}

export async function adminSetRound1State({
  questionIndex,
  stage,
  revealCorrectOption = null,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('admin_set_round1_state', {
    target_question_index: questionIndex,
    target_stage: stage,
    reveal_correct_option: revealCorrectOption,
  });

  if (error) throw error;
  return data;
}

export async function submitRound1Bet({
  questionIndex,
  betAmount,
  deviceFingerprint,
}) {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.rpc('submit_round1_bet', {
    target_question_index: questionIndex,
    target_bet_amount: betAmount,
    target_device_fingerprint: deviceFingerprint,
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

export async function listRound1Bets(questionIndex) {
  const supabase = requireSupabaseClient();

  let query = supabase
    .from('round1_bets')
    .select(
      `
        *,
        teams (
          team_code,
          display_name,
          icon,
          sort_order
        )
      `
    )
    .order('question_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (typeof questionIndex === 'number') {
    query = query.eq('question_index', questionIndex);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getTeamRound1Bet(teamId, questionIndex) {
  if (!teamId || typeof questionIndex !== 'number') return null;

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('round1_bets')
    .select('*')
    .eq('team_id', teamId)
    .eq('question_index', questionIndex)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listTeamScores() {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('team_scores')
    .select(
      `
        *,
        teams (
          team_code,
          display_name,
          icon,
          sort_order
        )
      `
    )
    .order('total_score', { ascending: false })
    .order('round1_tokens', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getTeamScore(teamId) {
  if (!teamId) return null;

  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('team_scores')
    .select('*')
    .eq('team_id', teamId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function subscribeToRound1Bets(onChange) {
  const supabase = requireSupabaseClient();
  const channel = supabase
    .channel(`round1_bets:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'round1_bets',
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToTeamScores(onChange) {
  const supabase = requireSupabaseClient();
  const channel = supabase
    .channel(`team_scores:${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'team_scores',
      },
      onChange
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
