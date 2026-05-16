import RoleShell from '../layouts/RoleShell';
import PresenterRound1Board from '../../components/PresenterRound1Board';
import PresenterRound2Board from '../../components/PresenterRound2Board';
import PresenterResultsBoard from '../../components/PresenterResultsBoard';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';

export default function PresenterRoute() {
  const phaseState = useSupabasePhase();

  return (
    <RoleShell
      eyebrow="MÀN HÌNH TRÌNH CHIẾU"
      title="PRESENTER"
      subtitle="Màn hình public/read-only cho máy chiếu lớp học. Không cần đăng nhập và luôn bám theo phase chung của game."
      badge="Presenter"
    >
      <div className="route-info-grid">
        {phaseState.phase.current_phase === 'results' ? (
          <PresenterResultsBoard phase={phaseState.phase} />
        ) : phaseState.phase.current_phase === 'round2' ? (
          <PresenterRound2Board phase={phaseState.phase} />
        ) : (
          <PresenterRound1Board phase={phaseState.phase} />
        )}
        <div className="route-info-card">
          <h2>Chế Độ Trình Chiếu</h2>
          <p>
            Route này chỉ để chiếu cho cả lớp: countdown, câu hỏi, tình huống đang active,
            tiến độ BGK và leaderboard. Presenter không có quyền mutate dữ liệu.
          </p>
          <p className="route-muted-text">
            Có thể mở trực tiếp bằng link `/presenter` trên màn hình máy chiếu mà không cần
            đăng nhập.
          </p>
        </div>
      </div>
    </RoleShell>
  );
}
