import { useGame } from '../hooks/useGameContext';
import './HUD.css';

const SCREEN_LABELS = {
  lobby: 'TIỀN SẢNH',
  round1: 'VÒNG 1 — NGÂN SÁCH NHÂN SỰ',
  round2: 'VÒNG 2 — HỌP KHẨN VỚI SẾP',
  results: 'KẾT QUẢ',
};

export default function HUD() {
  const { state } = useGame();
  const { screen, team, round1, round2 } = state;

  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-logo">🏢</span>
        <span className="hud-round-label">{SCREEN_LABELS[screen] || screen}</span>
      </div>

      <div className="hud-center">
        {team.name && (
          <span className="hud-team">
            <span className="hud-team-icon">👤</span>
            {team.name}
          </span>
        )}
      </div>

      <div className="hud-right">
        {screen === 'round1' && (
          <div className="token-badge">
            🪙 <span>{round1.tokens}</span> tokens
          </div>
        )}
        <div className="hud-scores">
          <span className="hud-score-item" title="Vòng 1">V1: <b>{round1.score}</b></span>
          <span className="hud-score-sep">|</span>
          <span className="hud-score-item" title="Vòng 2">V2: <b>{round2.score}</b></span>
        </div>
      </div>
    </div>
  );
}
