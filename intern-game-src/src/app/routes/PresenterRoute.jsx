import RoleShell from '../layouts/RoleShell';
import PresenterRound1Board from '../../components/PresenterRound1Board';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';

export default function PresenterRoute() {
  const phaseState = useSupabasePhase();

  return (
    <RoleShell
      eyebrow="MÀN HÌNH TRÌNH CHIẾU"
      title="PRESENTER"
      subtitle="Màn hình máy chiếu cho classroom mode. Route này chỉ đọc shared game state và luôn bám theo phase chung."
      badge="Presenter"
    >
      <div className="route-info-grid">
        <SharedPhaseCard roleLabel="presenter" phaseState={phaseState} />
        <PresenterRound1Board phase={phaseState.phase} />
        <div className="route-info-card">
          <h2>Chế Độ Presenter</h2>
          <p>Sẽ hiển thị countdown, đáp án, đội đang active, leaderboard và podium khi các phase sau được nối vào.</p>
        </div>
        <div className="route-info-card">
          <h2>Hiện Tại</h2>
          <p>Presenter đã đọc được phase dùng chung theo realtime, nên có thể dùng làm màn hình classroom nền ngay từ phase 004.</p>
        </div>
      </div>
    </RoleShell>
  );
}
