import { useState, useTransition } from 'react';
import {
  getPhaseLabel,
  SHARED_PHASE_OPTIONS,
  updateSharedGamePhase,
} from '../lib/supabase/gameState';
import { getSupabaseEnv } from '../lib/supabase/env';

export default function AdminPhaseControls({ phase }) {
  const { isConfigured } = getSupabaseEnv();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handlePhaseUpdate(nextPhase) {
    if (!isConfigured) {
      setError('Supabase chưa được cấu hình, nên admin shell chưa thể ghi shared phase.');
      setMessage('');
      return;
    }

    startTransition(async () => {
      try {
        setError('');
        setMessage('');

        await updateSharedGamePhase(nextPhase, {
          label: getPhaseLabel(nextPhase),
          source: 'admin-shell',
        });

        setMessage(`Đã gửi update shared phase sang ${getPhaseLabel(nextPhase)}.`);
      } catch (nextError) {
        setError(nextError.message || 'Không cập nhật được shared phase.');
      }
    });
  }

  return (
    <div className="route-info-card">
      <h2>Điều Khiển Phase</h2>
      <p>Phase hiện tại: {getPhaseLabel(phase.current_phase)}</p>
      <div className="route-phase-list">
        {SHARED_PHASE_OPTIONS.map((phaseOption) => (
          <button
            key={phaseOption.value}
            type="button"
            className={
              phase.current_phase === phaseOption.value
                ? 'btn btn-primary route-phase-button'
                : 'btn btn-ghost route-phase-button'
            }
            disabled={isPending}
            onClick={() => handlePhaseUpdate(phaseOption.value)}
          >
            {phaseOption.label}
          </button>
        ))}
      </div>
      <p className="route-phase-help">
        Đây là bước đầu của phase `004`: nếu schema đã được apply và admin auth hợp lệ, presenter và team sẽ nhảy phase theo realtime.
      </p>
      {message ? <p className="route-phase-success">{message}</p> : null}
      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
