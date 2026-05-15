import { requireSupabaseClient } from './client';
import { getSupabaseEnv } from './env';

export const SHARED_PHASE_OPTIONS = [
  { value: 'lobby', label: 'Lobby' },
  { value: 'round1', label: 'Round 1' },
  { value: 'round2', label: 'Round 2' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'results', label: 'Results' },
];

const DEFAULT_SHARED_PHASE = {
  current_phase: 'lobby',
  phase_payload: { label: 'Lobby' },
  active_team_id: null,
  current_question_index: null,
  phase_version: 0,
};

export async function getSharedGameState() {
  const supabase = requireSupabaseClient();
  const { eventSlug } = getSupabaseEnv();

  const { data, error } = await supabase
    .from('game_state')
    .select(
      `
        id,
        current_phase,
        phase_payload,
        active_team_id,
        current_question_index,
        phase_version,
        events!inner(slug)
      `
    )
    .eq('events.slug', eventSlug)
    .single();

  if (error) throw error;
  return data;
}

export async function updateSharedGamePhase(nextPhase, phasePayload = {}) {
  const supabase = requireSupabaseClient();
  const current = await getSharedGameState();

  const { error, data } = await supabase
    .from('game_state')
    .update({
      current_phase: nextPhase,
      phase_payload: phasePayload,
      phase_version: (current.phase_version || 0) + 1,
    })
    .eq('id', current.id)
    .select()
    .single();

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

export function subscribeToSharedGameState(onChange) {
  const supabase = requireSupabaseClient();
  const { eventSlug } = getSupabaseEnv();

  const channel = supabase
    .channel(`game_state:${eventSlug}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_state',
      },
      (payload) => {
        onChange(payload.new || payload.old || null);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
