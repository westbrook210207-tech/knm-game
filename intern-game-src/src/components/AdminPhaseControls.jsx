import { useState, useTransition } from 'react';
import {
  getPhaseLabel,
  SHARED_PHASE_OPTIONS,
  updateSharedGamePhase,
} from '../lib/supabase/gameState';
import { getSupabaseEnv } from '../lib/supabase/env';

export default function AdminPhaseControls({ phase, summary, onChanged }) {
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
          round: nextPhase,
          stage: nextPhase === 'paused' ? 'paused' : 'idle',
          source: 'admin-control-room',
        });
        await onChanged?.();

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
      {summary ? (
        <p className="route-muted-text">
          Stage: {summary.currentStage || 'idle'} · Câu hiện tại:{' '}
          {typeof summary.currentQuestionIndex === 'number'
            ? `Q${summary.currentQuestionIndex + 1}`
            : 'chưa chọn'}
        </p>
      ) : null}
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
        Dùng khối này để chuyển phase cấp cao cho toàn hệ thống. Các stage chi tiết của Round 1 vẫn được điều phối ở panel riêng bên dưới.
      </p>
      {message ? <p className="route-phase-success">{message}</p> : null}
      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
