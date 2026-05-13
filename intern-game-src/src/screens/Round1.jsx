import { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGameContext';
import { submitRound1Answer, getRound1Results } from '../api';
import HUD from '../components/HUD';
import Timer from '../components/Timer';
import Typewriter from '../components/Typewriter';
import './Round1.css';

const QUESTIONS = [
  {
    id: 1,
    text: 'Quy trình định vị bản thân có mấy bước? Kể tên?',
    difficulty: 'DỄ',
    answer: '3 bước: Xác định mục tiêu → SWOT → Kế hoạch hành động',
    options: [
      { label: 'A', text: '2 bước: Mục tiêu → SWOT' },
      { label: 'B', text: '3 bước: Mục tiêu → SWOT → Kế hoạch' },
      { label: 'C', text: '4 bước: Mục tiêu → SWOT → KH → Đánh giá' },
      { label: 'D', text: '3 bước: SWOT → Mục tiêu → Kế hoạch' },
    ],
    correct: 'B',
  },
  {
    id: 2,
    text: 'Trong mô hình ASK, kiến thức chiếm 85% sự thành công — Đúng hay Sai?',
    difficulty: 'DỄ (CÓ BẪY)',
    answer: 'Sai — Thái độ + Kỹ năng chiếm 85%, Kiến thức chỉ 15%',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
  {
    id: 3,
    text: '"Thương hiệu của bạn là những gì bạn nói về chính mình" — Jeff Bezos. Đúng hay Sai?',
    difficulty: 'TRUNG BÌNH',
    answer: 'Sai — là những gì người khác nói về bạn khi bạn không có mặt',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
  {
    id: 4,
    text: 'Trong SWOT bản thân, yếu tố nào thuộc môi trường bên ngoài?',
    difficulty: 'TRUNG BÌNH',
    answer: 'Opportunities + Threats (phải đủ cả hai)',
    options: [
      { label: 'A', text: 'Strengths + Weaknesses' },
      { label: 'B', text: 'Opportunities + Threats' },
      { label: 'C', text: 'Strengths + Opportunities' },
      { label: 'D', text: 'Weaknesses + Threats' },
    ],
    correct: 'B',
  },
  {
    id: 5,
    text: 'Kế hoạch hành động là bước thứ 2 trong quy trình định vị bản thân — Đúng hay Sai?',
    difficulty: 'KHÓ (CÓ BẪY)',
    answer: 'Sai — là bước thứ 3, bước 2 là SWOT',
    options: [
      { label: 'A', text: 'Đúng' },
      { label: 'B', text: 'Sai' },
    ],
    correct: 'B',
  },
];

const DIFFICULTY_COLORS = {
  'DỄ': 'var(--accent-green)',
  'DỄ (CÓ BẪY)': 'var(--accent-orange)',
  'TRUNG BÌNH': 'var(--accent-blue)',
  'KHÓ (CÓ BẪY)': 'var(--accent-red)',
};

const TOKEN_CONVERSION = [
  { min: 18, max: Infinity, points: 5 },
  { min: 14, max: 17, points: 4 },
  { min: 9,  max: 13, points: 3 },
  { min: 4,  max: 8,  points: 2 },
  { min: 0,  max: 3,  points: 1 },
];

function tokensToPoints(tokens) {
  return TOKEN_CONVERSION.find((r) => tokens >= r.min && tokens <= r.max)?.points ?? 0;
}

// Phase: betting | answering | reveal | done
export default function Round1() {
  const { state, dispatch } = useGame();
  const { sessionId, teamId, tokens, currentQuestion } = state;

  const [phase, setPhase] = useState('betting');
  const [bet, setBet] = useState(1);
  const [answer, setAnswer] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(null);
  const [timerKey, setTimerKey] = useState(0);
  const [bossMessage, setBossMessage] = useState('');

  const q = QUESTIONS[currentQuestion];
  const isLastQuestion = currentQuestion === QUESTIONS.length - 1;

  useEffect(() => {
    setBet(1);
    setAnswer(null);
    setRevealed(false);
    setCorrect(null);
    setPhase('betting');
    setTimerKey((k) => k + 1);
    if (q) setBossMessage(`Câu ${currentQuestion + 1}/5 — ${q.difficulty}`);
  }, [currentQuestion]);

  const confirmBet = () => {
    setPhase('answering');
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
        teamId,
        questionIndex: currentQuestion,
        answer: selected,
        bet,
      });
    } catch {
      // demo mode — continue without backend
    }

    setTimeout(() => setPhase('reveal'), 600);
  };

  const handleTimerExpire = () => {
    if (phase === 'betting') confirmBet();
    else if (phase === 'answering' && !answer) {
      submitAnswer('TIMEOUT');
    }
  };

  const next = () => {
    if (isLastQuestion) {
      const pts = tokensToPoints(state.tokens);
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
            <span className="r1-q-num">CÂU {currentQuestion + 1} / {QUESTIONS.length}</span>
            <span
              className="round-tag"
              style={{ background: DIFFICULTY_COLORS[q.difficulty] + '22', color: DIFFICULTY_COLORS[q.difficulty], border: `1px solid ${DIFFICULTY_COLORS[q.difficulty]}` }}
            >{q.difficulty}</span>
            <div style={{ marginLeft: 'auto' }}>
              <Timer
                key={timerKey}
                seconds={phase === 'betting' ? 15 : 30}
                onExpire={handleTimerExpire}
                paused={phase === 'reveal'}
              />
            </div>
          </div>

          <p className="r1-q-text">{q.text}</p>

          {/* Betting phase */}
          {phase === 'betting' && (
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
          {(phase === 'answering' || phase === 'reveal') && (
            <div className="r1-options fade-in">
              <p className="r1-phase-label">💬 BẠN ĐÃ ĐẶT CƯỢC: <strong>{bet} 🪙</strong> — Chọn đáp án!</p>
              <div className="r1-opt-grid">
                {q.options.map((opt) => {
                  let cls = 'r1-opt-btn';
                  if (phase === 'reveal') {
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
                      onClick={() => phase === 'answering' && submitAnswer(opt.label)}
                      disabled={phase === 'reveal'}
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
          {phase === 'reveal' && (
            <div className={`r1-reveal fade-in ${correct ? 'correct-reveal' : 'wrong-reveal'}`}>
              <div className="r1-reveal-verdict">{correct ? '✅ CHÍNH XÁC!' : '❌ SAI RỒI!'}</div>
              <div className="r1-reveal-answer">Đáp án: {q.answer}</div>
              <div className="r1-reveal-tokens">
                Token hiện tại: <strong>{state.tokens} 🪙</strong>
                {' '}→ {tokensToPoints(state.tokens)} điểm cuối vòng
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
              className={`r1-token-dot ${i < state.tokens ? 'filled' : 'empty'}`}
            />
          ))}
          <span className="r1-token-count">{state.tokens} / 20</span>
        </div>
      </div>
    </div>
  );
}
