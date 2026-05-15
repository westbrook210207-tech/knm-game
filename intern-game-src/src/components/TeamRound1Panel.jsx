import { useEffect, useState } from 'react';
import Timer from './Timer';
import Typewriter from './Typewriter';
import { ROUND1_QUESTIONS } from '../data/round1Questions';
import {
  getTeamRound1Snapshot,
  LIVE_REFRESH_INTERVAL_MS,
} from '../lib/game-backend';
import {
  getRound1LiveState,
  ROUND1_LIVE_STAGES,
  submitRound1Bet,
} from '../lib/supabase/round1';

function getTeamStageHelp(stage, canControl) {
  if (stage === ROUND1_LIVE_STAGES.BETTING) {
    return canControl
      ? 'Máy primary có thể đặt hoặc đổi bet cho đến khi admin khóa cược.'
      : 'Máy này đang ở chế độ read-only. Chỉ primary controller mới được đặt cược.';
  }

  if (stage === ROUND1_LIVE_STAGES.LOCKED) {
    return 'Đã khóa cược. Hãy chờ admin chấm kết quả sau khi giơ bảng.';
  }

  if (stage === ROUND1_LIVE_STAGES.REVEAL) {
    return 'Đang công bố đáp án và cập nhật token của đội.';
  }

  if (stage === ROUND1_LIVE_STAGES.COMPLETE) {
    return 'Round 1 đã kết thúc. Hãy chờ phase tiếp theo.';
  }

  return 'Admin chưa mở live Round 1.';
}

function getBossMessage(stage, questionNumber, canControl) {
  if (stage === ROUND1_LIVE_STAGES.BETTING) {
    return canControl
      ? `Câu ${questionNumber} đã mở. Hãy chốt mức cược trước khi tôi khóa sổ.`
      : `Câu ${questionNumber} đã mở, nhưng máy này chỉ được xem. Máy chính của đội sẽ chốt cược.`;
  }

  if (stage === ROUND1_LIVE_STAGES.LOCKED) {
    return `Câu ${questionNumber} đã khóa cược. Chuẩn bị giơ bảng và chờ tôi công bố kết quả.`;
  }

  if (stage === ROUND1_LIVE_STAGES.REVEAL) {
    return `Kết quả câu ${questionNumber} đang được công bố. Theo dõi token của đội ngay bên dưới.`;
  }

  if (stage === ROUND1_LIVE_STAGES.COMPLETE) {
    return 'Round 1 đã khép lại. Hãy chờ chỉ đạo cho phase tiếp theo.';
  }

  return 'Tôi sẽ bật câu hỏi tiếp theo khi admin khởi động Round 1 thật.';
}

export default function TeamRound1Panel({
  team,
  phase,
  session,
  deviceFingerprint,
  profileTeamId,
}) {
  const liveState = getRound1LiveState(phase);
  const question =
    typeof liveState.questionIndex === 'number'
      ? ROUND1_QUESTIONS[liveState.questionIndex]
      : null;
  const [betAmount, setBetAmount] = useState(1);
  const [bet, setBet] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const canControl = Boolean(session?.can_control);
  const questionNumber =
    typeof liveState.questionIndex === 'number' ? liveState.questionIndex + 1 : null;
  const bossMessage = getBossMessage(liveState.stage, questionNumber ?? '?', canControl);
  const timerSeconds =
    liveState.stage === ROUND1_LIVE_STAGES.BETTING
      ? 15
      : liveState.stage === ROUND1_LIVE_STAGES.LOCKED
        ? 5
        : 0;

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!profileTeamId || !liveState.isRound1) return;

      try {
        setLoading(true);
        const snapshot = await getTeamRound1Snapshot({
          teamProfileId: profileTeamId,
          questionIndex: liveState.questionIndex,
        });

        if (!alive) return;
        setBet(snapshot.bet || null);
        setScore(snapshot.score || null);
        if (snapshot.bet?.bet_amount) {
          setBetAmount(snapshot.bet.bet_amount);
        }
        setError('');
      } catch (nextError) {
        if (!alive) return;
        setError(nextError?.message || 'Không tải được trạng thái Round 1 của đội.');
      } finally {
        if (alive) setLoading(false);
      }
    }

    void load();
    const intervalId = window.setInterval(() => {
      void load();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      alive = false;
      window.clearInterval(intervalId);
    };
  }, [
    liveState.isRound1,
    liveState.questionIndex,
    liveState.stage,
    profileTeamId,
  ]);

  async function handleSubmitBet() {
    if (typeof liveState.questionIndex !== 'number') {
      setError('Admin chưa chọn câu hỏi hiện tại.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      setError('');
      await submitRound1Bet({
        questionIndex: liveState.questionIndex,
        betAmount,
        deviceFingerprint,
      });
      const snapshot = await getTeamRound1Snapshot({
        teamProfileId: profileTeamId,
        questionIndex: liveState.questionIndex,
      });
      setBet(snapshot.bet || null);
      setScore(snapshot.score || null);
      setMessage(`Đã ghi nhận cược ${betAmount} token cho câu ${liveState.questionIndex + 1}.`);
    } catch (nextError) {
      setError(nextError?.message || 'Không gửi được bet Round 1.');
    } finally {
      setLoading(false);
    }
  }

  if (!liveState.isRound1) {
    return (
      <div className="team-live__question-card slide-up">
        <div className="team-live__boss-panel">
          <div className="boss-avatar-lg">👔</div>
          <div className="dialog-box r1-boss-dialog">
            <div className="dialog-name">SẾP TỔNG</div>
            <div className="dialog-text">
              <Typewriter text="Round 1 chưa bắt đầu. Khi admin mở vòng chơi, câu hỏi và bảng cược sẽ xuất hiện ngay tại đây." speed={18} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="r1-main team-live__main">
      <div className="team-live__boss-panel">
        <div className="boss-avatar-lg">👔</div>
        <div className="dialog-box r1-boss-dialog">
          <div className="dialog-name">SẾP TỔNG</div>
          <div className="dialog-text">
            <Typewriter key={`${liveState.stage}-${questionNumber}-${canControl}`} text={bossMessage} speed={18} />
          </div>
        </div>
      </div>

      <div className="r1-question-card slide-up team-live__question-card">
        <div className="r1-q-header">
          <span className="r1-q-num">
            {questionNumber ? `CÂU ${questionNumber} / ${ROUND1_QUESTIONS.length}` : 'ROUND 1'}
          </span>
          <span className="route-status-pill">
            {team?.icon} {team?.name}
          </span>
          <span
            className={
              canControl
                ? 'route-status-pill route-status-pill--success'
                : 'route-status-pill route-status-pill--warning'
            }
          >
            {canControl ? 'Máy chính' : 'Chế độ xem'}
          </span>
          {timerSeconds > 0 ? (
            <div style={{ marginLeft: 'auto' }}>
              <Timer
                key={`${liveState.stage}-${questionNumber}`}
                seconds={timerSeconds}
                paused={false}
                onExpire={() => {}}
              />
            </div>
          ) : null}
        </div>

        <p className="r1-phase-label team-live__phase-copy">
          {getTeamStageHelp(liveState.stage, canControl)}
        </p>

        <div className="team-live__score-strip">
          <div className="token-badge">🪙 {score?.round1_tokens ?? 10} token</div>
          <div className="token-badge">🏆 {score?.round1_score ?? 3} điểm Round 1</div>
          {bet ? (
            <div className="token-badge">⚡ Cược hiện tại: {bet.bet_amount}</div>
          ) : null}
        </div>

        {question ? (
          <>
            <p className="r1-q-text">{question.text}</p>
            <div className="route-round1-options team-live__options">
              {question.options.map((option) => (
                <div
                  className={`route-round1-option team-live__option ${
                    liveState.stage === ROUND1_LIVE_STAGES.REVEAL &&
                    option.label === question.correct
                      ? 'route-round1-option--correct'
                      : ''
                  }`}
                  key={option.label}
                >
                  <strong>{option.label}</strong>
                  <span>{option.text}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p>Admin chưa chọn câu hỏi cho đội.</p>
        )}

        {liveState.stage === ROUND1_LIVE_STAGES.BETTING ? (
          <div className="r1-betting fade-in">
            <p className="r1-phase-label">⚡ CHỐT MỨC CƯỢC TOKEN</p>
            <div className="r1-bet-row team-live__bet-row">
              {[1, 2, 3, 4, 5].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className={`r1-bet-chip ${amount === betAmount ? 'active' : ''} ${
                    !canControl || amount > (score?.round1_tokens ?? 10) ? 'disabled' : ''
                  }`}
                  onClick={() => setBetAmount(amount)}
                  disabled={!canControl || amount > (score?.round1_tokens ?? 10)}
                >
                  {amount}🪙
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-primary r1-confirm-btn"
              onClick={handleSubmitBet}
              disabled={!canControl || liveState.stage !== ROUND1_LIVE_STAGES.BETTING || loading}
            >
              {bet ? `Cập nhật cược ${betAmount} token` : `Đặt cược ${betAmount} token`}
            </button>
          </div>
        ) : null}

        {liveState.stage === ROUND1_LIVE_STAGES.REVEAL && question ? (
          <div className="r1-reveal fade-in correct-reveal">
            <div className="r1-reveal-verdict">ĐÁP ÁN ĐÚNG: {question.correct}</div>
            <div className="r1-reveal-answer">{question.answer}</div>
          </div>
        ) : null}

        {message ? <p className="route-phase-success">{message}</p> : null}
        {error ? <p className="route-error-text">{error}</p> : null}
        {loading ? <p className="route-muted-text">Đang đồng bộ Round 1...</p> : null}
      </div>

      <div className="r1-token-bar team-live__token-bar">
        {Array.from({ length: 20 }).map((_, index) => (
          <div
            key={index}
            className={`r1-token-dot ${index < (score?.round1_tokens ?? 10) ? 'filled' : 'empty'}`}
          />
        ))}
        <span className="r1-token-count">{score?.round1_tokens ?? 10} / 20</span>
      </div>
    </div>
  );
}
