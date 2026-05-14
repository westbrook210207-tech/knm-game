import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGameContext';
import { submitRound1Answer } from '../api';
import HUD from '../components/HUD';
import Timer from '../components/Timer';
import Typewriter from '../components/Typewriter';
import {
  ROUND1_DIFFICULTY_COLORS,
  ROUND1_QUESTIONS,
} from '../data/round1Questions';
import { ROUND1_PHASES } from '../game/round1';
import { tokensToPoints } from '../game/scoring';
import './Round1.css';

// Phase: betting | answering | reveal | done
export default function Round1() {
  const { state, dispatch } = useGame();
  const { sessionId, team, round1 } = state;
  const { tokens, currentQuestion } = round1;

  const [phase, setPhase] = useState(ROUND1_PHASES.BETTING);
  const [bet, setBet] = useState(1);
  const [answer, setAnswer] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [bossMessage, setBossMessage] = useState('');

  const q = ROUND1_QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === ROUND1_QUESTIONS.length - 1;

  useEffect(() => {
    setBet(1);
    setAnswer(null);
    setCorrect(null);
    setPhase(ROUND1_PHASES.BETTING);
    setTimerKey((k) => k + 1);
    if (q) setBossMessage(`Câu ${currentQuestion + 1}/5 — ${q.difficulty}`);
  }, [currentQuestion, q]);

  const confirmBet = () => {
    setPhase(ROUND1_PHASES.ANSWERING);
    setTimerKey((k) => k + 1);
    setBossMessage('Thảo luận nội bộ — chọn đáp án!');
  };

  const submitAnswer = async (selected) => {
    if (answer) return;
    setAnswer(selected);
    const isCorrect = selected === q.correct;
    setCorrect(isCorrect);

    const newTokens = isCorrect ? tokens + bet : Math.max(0, tokens - bet);
    dispatch({ type: 'UPDATE_TOKENS', payload: newTokens });

    setBossMessage(isCorrect ? `✅ CHÍNH XÁC! +${bet} token` : `❌ SAI RỒI! -${bet} token`);

    try {
      await submitRound1Answer(sessionId, {
        teamId: team.id,
        questionIndex: currentQuestion,
        answer: selected,
        bet,
      });
    } catch {
      // demo mode — continue without backend
    }

    setTimeout(() => setPhase(ROUND1_PHASES.REVEAL), 600);
  };

  const handleTimerExpire = () => {
    if (phase === ROUND1_PHASES.BETTING) confirmBet();
    else if (phase === ROUND1_PHASES.ANSWERING && !answer) {
      submitAnswer('TIMEOUT');
    }
  };

  const next = () => {
    if (isLastQuestion) {
      const pts = tokensToPoints(state.round1.tokens);
      dispatch({ type: 'SET_ROUND1_SCORE', payload: pts });
      dispatch({ type: 'RESET_QUESTION' });
      dispatch({ type: 'SET_SCREEN', payload: 'round2' });
    } else {
      dispatch({ type: 'NEXT_QUESTION' });
    }
  };

  if (!q) return null;

  return (
    <div className="r1 screen">
      <HUD />

      <div className="r1-main">
        {/* Boss panel */}
        <div className="r1-boss-panel">
          <div className="boss-avatar-lg">👔</div>
          <div className="dialog-box r1-boss-dialog">
            <div className="dialog-name">SẾP TỔNG</div>
            <div className="dialog-text">
              <Typewriter key={bossMessage} text={bossMessage} speed={20} />
            </div>
          </div>
        </div>

        {/* Question card */}
        <div className="r1-question-card slide-up">
          <div className="r1-q-header">
            <span className="r1-q-num">CÂU {currentQuestion + 1} / {ROUND1_QUESTIONS.length}</span>
            <span
              className="round-tag"
              style={{ background: ROUND1_DIFFICULTY_COLORS[q.difficulty] + '22', color: ROUND1_DIFFICULTY_COLORS[q.difficulty], border: `1px solid ${ROUND1_DIFFICULTY_COLORS[q.difficulty]}` }}
            >{q.difficulty}</span>
            <div style={{ marginLeft: 'auto' }}>
              <Timer
                key={timerKey}
                seconds={phase === ROUND1_PHASES.BETTING ? 15 : 30}
                onExpire={handleTimerExpire}
                paused={phase === ROUND1_PHASES.REVEAL}
              />
            </div>
          </div>

          <p className="r1-q-text">{q.text}</p>

          {/* Betting phase */}
          {phase === ROUND1_PHASES.BETTING && (
            <div className="r1-betting fade-in">
              <p className="r1-phase-label">⚡ ĐẶT CƯỢC TOKEN (có {tokens} token)</p>
              <div className="r1-bet-row">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`r1-bet-chip ${bet === n ? 'active' : ''} ${n > tokens ? 'disabled' : ''}`}
                    onClick={() => n <= tokens && setBet(n)}
                  >
                    {n}🪙
                  </button>
                ))}
              </div>
              <button className="btn btn-primary r1-confirm-btn" onClick={confirmBet}>
                Đặt cược {bet} token →
              </button>
            </div>
          )}

          {/* Answering phase */}
          {(phase === ROUND1_PHASES.ANSWERING || phase === ROUND1_PHASES.REVEAL) && (
            <div className="r1-options fade-in">
              <p className="r1-phase-label">💬 BẠN ĐÃ ĐẶT CƯỢC: <strong>{bet} 🪙</strong> — Chọn đáp án!</p>
              <div className="r1-opt-grid">
                {q.options.map((opt) => {
                  let cls = 'r1-opt-btn';
                  if (phase === ROUND1_PHASES.REVEAL) {
                    if (opt.label === q.correct) cls += ' correct';
                    else if (opt.label === answer) cls += ' wrong';
                    else cls += ' dimmed';
                  } else if (answer === opt.label) {
                    cls += ' selected';
                  }
                  return (
                    <button
                      key={opt.label}
                      className={cls}
                      onClick={() => phase === ROUND1_PHASES.ANSWERING && submitAnswer(opt.label)}
                      disabled={phase === ROUND1_PHASES.REVEAL}
                    >
                      <span className="r1-opt-label">{opt.label}</span>
                      <span className="r1-opt-text">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reveal phase */}
          {phase === ROUND1_PHASES.REVEAL && (
            <div className={`r1-reveal fade-in ${correct ? 'correct-reveal' : 'wrong-reveal'}`}>
              <div className="r1-reveal-verdict">{correct ? '✅ CHÍNH XÁC!' : '❌ SAI RỒI!'}</div>
              <div className="r1-reveal-answer">Đáp án: {q.answer}</div>
              <div className="r1-reveal-tokens">
                Token hiện tại: <strong>{state.round1.tokens} 🪙</strong>
                {' '}→ {tokensToPoints(state.round1.tokens)} điểm cuối vòng
              </div>
              <button className="btn btn-primary" onClick={next} style={{ marginTop: '0.8rem' }}>
                {isLastQuestion ? '📊 Xem kết quả vòng 1 →' : 'Câu tiếp theo →'}
              </button>
            </div>
          )}
        </div>

        {/* Token bar */}
        <div className="r1-token-bar">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className={`r1-token-dot ${i < state.round1.tokens ? 'filled' : 'empty'}`}
            />
          ))}
          <span className="r1-token-count">{state.round1.tokens} / 20</span>
        </div>
      </div>
    </div>
  );
}
