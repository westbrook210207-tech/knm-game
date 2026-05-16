import { useState } from 'react';
import { useGame } from '../hooks/useGameContext';
import { submitRound2SWOT } from '../api';
import HUD from '../components/HUD';
import Timer from '../components/Timer';
import {
  ROUND2_SWOT_FIELDS,
} from '../data/round2Scenarios';
import {
  getDefaultSwotState,
  getScenarioByTeamId,
} from '../game/round2';
import './Round2.css';

export default function Round2() {
  const { state, dispatch } = useGame();
  const { sessionId, team } = state;

  const scenario = getScenarioByTeamId(team.id);
  const [swot, setSwot] = useState(getDefaultSwotState);
  const [phase, setPhase] = useState('reading'); // reading | writing | submitted
  const [showHints, setShowHints] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [timerKey] = useState(0);

  const updateSwot = (key, val) => setSwot((s) => ({ ...s, [key]: val }));

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await submitRound2SWOT(sessionId, { teamId: team.id, ...swot });
    } catch {
      // demo mode
    }
    setPhase('submitted');
    // Score will be assigned by judges; for demo set a placeholder
    dispatch({ type: 'SET_ROUND2_SCORE', payload: 0 });
  };

  const goResults = () => {
    dispatch({ type: 'SET_SCREEN', payload: 'results' });
  };

  return (
    <div className="r2 screen">
      <HUD />

      <div className="r2-main">
        {/* Left: file / scenario */}
        <div className="r2-left">
          <div className="r2-file-header">
            <span className="r2-file-icon">🗂️</span>
            <div>
              <div className="r2-file-title">HỒ SƠ NHÂN VIÊN #{team.id?.toUpperCase()}</div>
              <div className="r2-file-sub">{scenario.name} · {scenario.age} tuổi · {scenario.major}</div>
            </div>
          </div>

          <div className="r2-file-body">
            <p>{scenario.file}</p>
          </div>

          {phase === 'reading' && (
            <button className="btn btn-primary r2-ready-btn" onClick={() => setPhase('writing')}>
              ✅ Đã đọc xong — Bắt đầu phân tích →
            </button>
          )}

          {phase === 'writing' && (
            <div className="r2-timer-row">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Thời gian thảo luận</span>
              <Timer key={timerKey} seconds={120} onExpire={() => {}} />
            </div>
          )}
        </div>

        {/* Right: SWOT form */}
        <div className="r2-right">
          <div className="r2-boss-strip">
            <span className="boss-avatar-sm">👔</span>
            <div className="dialog-box r2-mini-dialog">
              <div className="dialog-name" style={{ fontSize: '1rem' }}>SẾP TỔNG</div>
              <div className="dialog-text" style={{ fontSize: '0.9rem' }}>
                {phase === 'reading'
                  ? 'Đọc kỹ hồ sơ trước khi phân tích SWOT!'
                  : phase === 'writing'
                  ? 'Phân tích SWOT — lập luận có logic, liên kết các yếu tố!'
                  : 'Tốt! Chờ ban giám khảo chấm điểm...'}
              </div>
            </div>
          </div>

          <div className="r2-swot-grid">
              {ROUND2_SWOT_FIELDS.map(({ key, label, emoji, color, description }) => (
              <div
                key={key}
                className="r2-swot-cell"
                style={{ '--cell-color': color }}
              >
                <div className="r2-swot-cell-header">
                  <span className="r2-swot-emoji">{emoji}</span>
                  <span className="r2-swot-label">{key} — {label}</span>
                  <span className="r2-swot-desc">{description}</span>
                </div>
                <textarea
                  className="r2-swot-input"
                  placeholder={phase === 'submitted' ? scenario.hints[key] : `Nhập ${label}...`}
                  value={phase === 'submitted' ? scenario.hints[key] : swot[key]}
                  onChange={(e) => updateSwot(key, e.target.value)}
                  disabled={phase !== 'writing'}
                  rows={3}
                />
              </div>
            ))}
          </div>

          {phase === 'writing' && (
            <div className="r2-actions">
              <button
                className="btn btn-ghost"
                onClick={() => setShowHints(!showHints)}
              >
                {showHints ? 'Ẩn gợi ý' : '💡 Xem gợi ý (trừ điểm)'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!swot.S && !swot.W && !swot.O && !swot.T}
              >
                📤 Nộp phân tích →
              </button>
            </div>
          )}

          {showHints && phase === 'writing' && (
            <div className="r2-hints fade-in">
              {ROUND2_SWOT_FIELDS.map(({ key, color }) => (
                <div key={key} style={{ color, fontSize: '0.85rem' }}>
                  <strong>{key}:</strong> {scenario.hints[key]}
                </div>
              ))}
            </div>
          )}

          {phase === 'submitted' && (
            <div className="r2-submitted slide-up">
              <div className="r2-submitted-title">📋 ĐÃ NỘP — Chờ ban giám khảo chấm!</div>
              <div className="r2-submitted-sub">Đây là đáp án tham khảo của BGK</div>
              <button className="btn btn-primary" onClick={goResults} style={{ marginTop: '0.8rem' }}>
                🏁 Tiếp tục: Xem kết quả →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
