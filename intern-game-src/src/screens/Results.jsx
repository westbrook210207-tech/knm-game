import { useGame } from '../hooks/useGameContext';
import HUD from '../components/HUD';
import './Results.css';

const TOKEN_CONVERSION = [
  { min: 18, points: 5 }, { min: 14, points: 4 },
  { min: 9, points: 3 }, { min: 4, points: 2 }, { min: 0, points: 1 },
];
function tokensToPoints(t) {
  return TOKEN_CONVERSION.find((r) => t >= r.min)?.points ?? 0;
}

export default function Results() {
  const { state, dispatch } = useGame();
  const { tokens, round1Score, round2Score, bonusScore, teamName } = state;
  const r1 = round1Score || tokensToPoints(tokens);
  const total = r1 + round2Score + bonusScore;

  const verdict = total >= 9
    ? { label: 'THĂNG CHỨC! 🎉', cls: 'promoted', msg: 'Chúc mừng! Bạn đã chứng minh được năng lực. Tập Đoàn XYZ chính thức tuyển dụng phòng ban của bạn!' }
    : { label: 'SA THẢI 💀', cls: 'fired', msg: 'Rất tiếc! Phòng ban của bạn chưa đáp ứng được yêu cầu. Hẹn gặp lại lần sau!' };

  const rows = [
    { label: 'Vòng 1 — Ngân sách nhân sự', score: r1, max: 5, icon: '🪙' },
    { label: 'Vòng 2 — Họp khẩn với sếp', score: round2Score, max: 5, icon: '🗂️' },
    { label: 'Bonus — Vượt đường về nhà', score: bonusScore, max: 2, icon: '🎮' },
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
          <div className="results-team-name">📋 {teamName || 'Phòng ban của bạn'}</div>

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
            <span className="results-total-num">{total} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 12</span></span>
          </div>
        </div>

        <button
          className="btn btn-ghost results-restart"
          onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'lobby' })}
        >
          ↩ Chơi lại
        </button>
      </div>
    </div>
  );
}
