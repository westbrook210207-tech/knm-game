import { useEffect, useState } from 'react';
import {
  getDefaultSharedPhase,
} from '../lib/supabase/gameState';
import {
  getSharedPhaseSnapshot,
  LIVE_REFRESH_INTERVAL_MS,
} from '../lib/game-backend';
import { getSupabaseEnv } from '../lib/supabase/env';

function getSharedPhaseErrorMessage(error) {
  if (error?.code === 'PGRST205') {
    return 'Schema shared-state chưa được apply trên Supabase project này.';
  }

  if (error?.code === 'PGRST116') {
    return 'Schema đã có, nhưng row game_state cho event hiện tại vẫn chưa được seed.';
  }

  return error?.message || 'Không tải được shared game state.';
}

function normalizeSharedPhase(data, previousPhase = getDefaultSharedPhase()) {
  if (!data) return previousPhase;

  return {
    current_phase:
      Object.prototype.hasOwnProperty.call(data, 'current_phase')
        ? data.current_phase
        : previousPhase.current_phase,
    phase_payload:
      Object.prototype.hasOwnProperty.call(data, 'phase_payload')
        ? data.phase_payload || {}
        : previousPhase.phase_payload,
    active_team_id:
      Object.prototype.hasOwnProperty.call(data, 'active_team_id')
        ? data.active_team_id ?? null
        : previousPhase.active_team_id,
    current_question_index:
      Object.prototype.hasOwnProperty.call(data, 'current_question_index')
        ? data.current_question_index ?? null
        : previousPhase.current_question_index,
    phase_version:
      Object.prototype.hasOwnProperty.call(data, 'phase_version')
        ? data.phase_version ?? 0
        : previousPhase.phase_version,
  };
}

export function useSupabasePhase() {
  const [phase, setPhase] = useState(getDefaultSharedPhase());
  const [loading, setLoading] = useState(getSupabaseEnv().isConfigured);
  const [error, setError] = useState('');

  useEffect(() => {
    const { isConfigured } = getSupabaseEnv();

    if (!isConfigured) {
      setLoading(false);
      setError('Supabase chưa được cấu hình trong environment.');
      return undefined;
    }

    let alive = true;
    let pollId = null;

    async function refreshPhase({ silent = false } = {}) {
      try {
        if (!silent && alive) {
          setLoading(true);
        }

        const data = await getSharedPhaseSnapshot();
        if (!alive) return;

        setPhase((previousPhase) => normalizeSharedPhase(data, previousPhase));
        setError('');
      } catch (err) {
        if (!alive) return;
        setError(getSharedPhaseErrorMessage(err));
      } finally {
        if (alive) setLoading(false);
      }
    }

    function handleVisibilityRefresh() {
      if (document.visibilityState === 'visible') {
        void refreshPhase({ silent: true });
      }
    }

    async function init() {
      await refreshPhase();

      pollId = window.setInterval(() => {
        void refreshPhase({ silent: true });
      }, LIVE_REFRESH_INTERVAL_MS);

      window.addEventListener('focus', handleVisibilityRefresh);
      document.addEventListener('visibilitychange', handleVisibilityRefresh);
    }

    init();

    return () => {
      alive = false;
      if (pollId) window.clearInterval(pollId);
      window.removeEventListener('focus', handleVisibilityRefresh);
      document.removeEventListener('visibilitychange', handleVisibilityRefresh);
    };
  }, []);

  return { phase, loading, error, isConfigured: getSupabaseEnv().isConfigured };
}
