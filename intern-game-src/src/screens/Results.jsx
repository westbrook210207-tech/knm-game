import { useGame } from '../hooks/useGameContext';
import HUD from '../components/HUD';
import { calculateTotalScore, tokensToPoints } from '../game/scoring';
import './Results.css';

export default function Results() {
  const { state, dispatch } = useGame();
  const { team, round1, round2 } = state;
  const r1 = round1.score || tokensToPoints(round1.tokens);
  const total = calculateTotalScore(r1, round2.score);

  const verdict = total >= 9
    ? { label: 'THĂNG CHỨC! 🎉', cls: 'promoted', msg: 'Chúc mừng! Bạn đã chứng minh được năng lực. Tập Đoàn XYZ chính thức tuyển dụng phòng ban của bạn!' }
    : { label: 'SA THẢI 💀', cls: 'fired', msg: 'Rất tiếc! Phòng ban của bạn chưa đáp ứng được yêu cầu. Hẹn gặp lại lần sau!' };

  const rows = [
    { label: 'Vòng 1 — Ngân sách nhân sự', score: r1, max: 5, icon: '🪙' },
    { label: 'Vòng 2 — Họp khẩn với sếp', score: round2.score, max: 5, icon: '🗂️' },
  ];

  return (
    <div className="results screen">
      <HUD />

      <div className="results-main">
        <div className="results-boss-area">
          <div className="boss-avatar-xl">👔</div>
          <div className={`results-verdict ${verdict.cls}`}>
            <div className="results-verdict-label">{verdict.label}</div>
            <div className="results-verdict-msg">{verdict.msg}</div>
          </div>
        </div>

        <div className="results-card slide-up">
          <div className="results-team-name">📋 {team.name || 'Phòng ban của bạn'}</div>

          <div className="results-rows">
            {rows.map((r) => (
              <div key={r.label} className="results-row">
                <span className="results-row-icon">{r.icon}</span>
                <span className="results-row-label">{r.label}</span>
                <div className="results-bar-track">
                  <div
                    className="results-bar-fill"
                    style={{ width: `${(r.score / r.max) * 100}%` }}
                  />
                </div>
                <span className="results-row-score">{r.score} / {r.max}</span>
              </div>
            ))}
          </div>

          <div className="results-total-row">
            <span>TỔNG ĐIỂM</span>
            <span className="results-total-num">{total} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 10</span></span>
          </div>
        </div>

        <button
          className="btn btn-ghost results-restart"
          onClick={() => dispatch({ type: 'RESET_GAME' })}
        >
          ↩ Chơi lại
        </button>
      </div>
    </div>
  );
}
