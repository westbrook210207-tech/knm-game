import { useEffect, useMemo, useState } from 'react';
import { getRound2PresenterSnapshot, getSnapshotRefreshInterval } from '../lib/game-backend';

function getPodiumLabel(index) {
  if (index === 0) return 'Vô địch';
  if (index === 1) return 'Á quân';
  if (index === 2) return 'Top 3';
  return `#${index + 1}`;
}

export default function PresenterResultsBoard({ phase }) {
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [state, setState] = useState({
    leaderboard: [],
    error: '',
  });

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const snapshot = await getRound2PresenterSnapshot();
        if (!alive) return;
        setState({
          leaderboard: snapshot.leaderboard || [],
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setState((current) => ({
          ...current,
          error: error?.message || 'Không tải được bảng kết quả cuối.',
        }));
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
  }, [pollIntervalMs]);

  const topThree = useMemo(() => state.leaderboard.slice(0, 3), [state.leaderboard]);

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Kết Quả Chung Cuộc</h2>
        <p>
          Phase results đã được mở. Đây là bảng xếp hạng cuối cùng sau Round 1 và Round 2.
        </p>
        {state.error ? <p className="route-error-text">{state.error}</p> : null}
      </div>

      <div className="route-results-podium">
        {topThree.map((score, index) => (
          <div className="route-results-podium-card" key={score.id}>
            <span className="route-status-pill route-status-pill--warning">
              {getPodiumLabel(index)}
            </span>
            <h3>
              #{index + 1} {score.teams?.icon} {score.teams?.display_name}
            </h3>
            <p className="route-muted-text">
              V1: {score.round1_score} · V2: {score.round2_score}
            </p>
            <div className="route-results-total">{score.total_score} điểm</div>
          </div>
        ))}
      </div>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Leaderboard Cuối</h2>
        <div className="route-round1-list">
          {state.leaderboard.map((score, index) => (
            <div className="route-round1-row" key={score.id}>
              <div>
                <strong>
                  #{index + 1} {score.teams?.icon} {score.teams?.display_name}
                </strong>
                <p className="route-muted-text">
                  V1: {score.round1_score} · V2: {score.round2_score}
                </p>
              </div>
              <span className="route-status-pill route-status-pill--success">
                {score.total_score} điểm
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
