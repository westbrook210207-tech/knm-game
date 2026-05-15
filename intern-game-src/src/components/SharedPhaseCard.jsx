import { getSupabaseEnv } from '../lib/supabase/env';
import { useSupabasePhase } from '../hooks/useSupabasePhase';

export default function SharedPhaseCard({ roleLabel, phaseState }) {
  const fallbackPhaseState = useSupabasePhase();
  const { phase, loading, error, isConfigured } = phaseState || fallbackPhaseState;
  const { eventSlug } = getSupabaseEnv();

  return (
    <div className="route-info-card">
      <h2>Trạng Thái Phase Dùng Chung</h2>
      <p>Vai trò hiện tại: {roleLabel}</p>
      <p>Event slug: {eventSlug}</p>
      <p>Supabase đã cấu hình: {isConfigured ? 'có' : 'không'}</p>
      <p>Đang tải: {loading ? 'có' : 'không'}</p>
      <p>Phase hiện tại: {phase.current_phase || 'không-rõ'}</p>
      <p>Phiên bản phase: {phase.phase_version ?? 0}</p>
      {phase.phase_payload?.label ? <p>Nhãn hiển thị: {phase.phase_payload.label}</p> : null}
      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
