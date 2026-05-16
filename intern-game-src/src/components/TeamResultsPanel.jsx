import { useEffect, useState } from 'react';
import Typewriter from './Typewriter';
import { getSnapshotRefreshInterval, getTeamLiveSnapshot } from '../lib/game-backend';

function getVerdict(score) {
  if (!score) {
    return {
      label: 'Chờ công bố',
      tone: 'route-status-pill',
      copy: 'Admin đang hoàn tất phần công bố kết quả cuối. Đội hãy chờ trong giây lát.',
    };
  }

  if ((score.rank ?? 99) <= 3) {
    return {
      label: 'Top đầu bảng',
      tone: 'route-status-pill route-status-pill--success',
      copy: 'Đội bạn đã cán đích ở nhóm dẫn đầu. Hãy chờ phần podium trên màn hình presenter.',
    };
  }

  return {
    label: 'Đã chốt kết quả',
    tone: 'route-status-pill route-status-pill--warning',
    copy: 'Kết quả cuối đã khóa. Hãy theo dõi màn hình presenter để xem bảng xếp hạng đầy đủ.',
  };
}

export default function TeamResultsPanel({ team, phase, sessionToken }) {
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [state, setState] = useState({
    score: null,
    error: '',
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const snapshot = await getTeamLiveSnapshot({
          teamCode: team.id,
          sessionToken,
        });
        if (!alive) return;
        setState({
          score: snapshot.score || null,
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setState({
          score: null,
          error: error?.message || 'Không tải được kết quả cuối của đội.',
        });
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, pollIntervalMs);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [pollIntervalMs, sessionToken, team.id]);

  const verdict = getVerdict(state.score);

  return (
    <div className="team-live__question-card slide-up">
      <div className="team-live__boss-panel">
        <div className="boss-avatar-lg">👔</div>
        <div className="dialog-box r1-boss-dialog">
          <div className="dialog-name">SẾP TỔNG</div>
          <div className="dialog-text">
            <Typewriter key={verdict.label} text={verdict.copy} speed={18} />
          </div>
        </div>
      </div>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <div className="route-inline-actions route-inline-actions--compact">
          <span className="route-status-pill">{team.icon} {team.name}</span>
          <span className={verdict.tone}>{verdict.label}</span>
          {typeof state.score?.rank === 'number' ? (
            <span className="token-badge token-badge--rank"># {state.score.rank}</span>
          ) : null}
        </div>

        <div className="team-live__score-strip">
          <div className="token-badge">🏆 V1: {state.score?.round1_score ?? 0}</div>
          <div className="token-badge">🧠 V2: {state.score?.round2_score ?? 0}</div>
          <div className="token-badge">✨ Tổng: {state.score?.total_score ?? 0}</div>
          <div className="token-badge">🪙 Token cuối: {state.score?.round1_tokens ?? 0}</div>
        </div>

        <p className="team-live__phase-copy">
          Màn này chỉ hiển thị kết quả cuối của đội. Nếu cần chạy lại event, admin sẽ reset hệ thống từ control room.
        </p>
        {state.error ? <p className="route-error-text">{state.error}</p> : null}
      </div>
    </div>
  );
}
