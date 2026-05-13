import { useGame } from '../hooks/useGameContext';
import './HUD.css';

const SCREEN_LABELS = {
  lobby: 'TIỀN SẢNH',
  round1: 'VÒNG 1 — NGÂN SÁCH NHÂN SỰ',
  round2: 'VÒNG 2 — HỌP KHẨN VỚI SẾP',
  bonus: 'BONUS — VƯỢT ĐƯỜNG VỀ NHÀ',
  results: 'KẾT QUẢ',
};

export default function HUD() {
  const { state } = useGame();
  const { screen, teamName, tokens, round1Score, round2Score, bonusScore } = state;

  return (
    <div className="hud">
      <div className="hud-left">
        <span className="hud-logo">🏢</span>
        <span className="hud-round-label">{SCREEN_LABELS[screen] || screen}</span>
      </div>

      <div className="hud-center">
        {teamName && (
          <span className="hud-team">
            <span className="hud-team-icon">👤</span>
            {teamName}
          </span>
        )}
      </div>

      <div className="hud-right">
        {screen === 'round1' && (
          <div className="token-badge">
            🪙 <span>{tokens}</span> tokens
          </div>
        )}
        <div className="hud-scores">
          <span className="hud-score-item" title="Vòng 1">V1: <b>{round1Score}</b></span>
          <span className="hud-score-sep">|</span>
          <span className="hud-score-item" title="Vòng 2">V2: <b>{round2Score}</b></span>
          <span className="hud-score-sep">|</span>
          <span className="hud-score-item" title="Bonus">B: <b>{bonusScore}</b></span>
        </div>
      </div>
    </div>
  );
}
