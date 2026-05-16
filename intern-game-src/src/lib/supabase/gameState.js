import { requireSupabaseClient } from './client';
import { getSupabaseEnv } from './env';

export const SHARED_PHASE_OPTIONS = [
  { value: 'lobby', label: 'Lobby' },
  { value: 'round1', label: 'Round 1' },
  { value: 'round2', label: 'Round 2' },
  { value: 'results', label: 'Results' },
  { value: 'paused', label: 'Paused' },
];

const DEFAULT_SHARED_PHASE = {
  current_phase: 'lobby',
  phase_payload: { label: 'Lobby' },
  active_team_id: null,
  current_question_index: null,
  phase_version: 0,
};

export async function updateSharedGamePhase(nextPhase, phasePayload = {}) {
  const supabase = requireSupabaseClient();
  const { eventSlug } = getSupabaseEnv();

  const { error, data } = await supabase.rpc('admin_set_shared_phase', {
    target_event_slug: eventSlug,
    next_phase: nextPhase,
    next_phase_payload: phasePayload,
  });

  if (error) throw error;
  return data;
}

export function getPhaseLabel(phaseValue) {
  return (
    SHARED_PHASE_OPTIONS.find((phase) => phase.value === phaseValue)?.label ||
    phaseValue ||
    'Unknown'
  );
}

export function getDefaultSharedPhase() {
  return DEFAULT_SHARED_PHASE;
}
