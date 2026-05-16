import { useEffect, useState } from 'react';
import FocusModal from './FocusModal';
import Timer from './Timer';
import { ROUND1_QUESTIONS } from '../data/round1Questions';
import {
  getPresenterSnapshot,
  getSnapshotRefreshInterval,
} from '../lib/game-backend';
import {
  getRound1LiveState,
  ROUND1_LIVE_STAGES,
} from '../lib/supabase/round1';

function getStageCopy(stage) {
  if (stage === ROUND1_LIVE_STAGES.BETTING) return 'Các đội đang đặt cược token.';
  if (stage === ROUND1_LIVE_STAGES.LOCKED) return 'Đã khóa cược. Hãy chuẩn bị giơ bảng!';
  if (stage === ROUND1_LIVE_STAGES.REVEAL) return 'Đang công bố đáp án và cập nhật leaderboard.';
  if (stage === ROUND1_LIVE_STAGES.COMPLETE) return 'Round 1 đã khép lại.';
  return 'Đang chờ admin kích hoạt Round 1.';
}

function getStagePill(stage) {
  if (stage === ROUND1_LIVE_STAGES.BETTING) {
    return {
      label: 'Đang đặt cược',
      tone: 'route-status-pill route-status-pill--warning',
    };
  }

  if (stage === ROUND1_LIVE_STAGES.LOCKED) {
    return {
      label: 'Đã khóa cược',
      tone: 'route-status-pill route-status-pill--danger',
    };
  }

  if (stage === ROUND1_LIVE_STAGES.REVEAL) {
    return {
      label: 'Đang công bố',
      tone: 'route-status-pill route-status-pill--success',
    };
  }

  if (stage === ROUND1_LIVE_STAGES.COMPLETE) {
    return {
      label: 'Đã kết thúc',
      tone: 'route-status-pill',
    };
  }

  return {
    label: 'Chờ admin mở vòng',
    tone: 'route-status-pill',
  };
}

export default function PresenterRound1Board({ phase }) {
  const liveState = getRound1LiveState(phase);
  const question =
    typeof liveState.questionIndex === 'number'
      ? ROUND1_QUESTIONS[liveState.questionIndex]
      : null;
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const stagePill = getStagePill(liveState.stage);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const snapshot = await getPresenterSnapshot();
        if (!alive) return;
        setScores(snapshot.leaderboard || []);
        setError('');
      } catch (nextError) {
        if (!alive) return;
        setError(nextError?.message || 'Không tải được leaderboard Round 1.');
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

  if (!liveState.isRound1) {
    return (
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Round 1 Chưa Được Mở</h2>
        <p>Presenter sẽ hiển thị câu hỏi, trạng thái đặt cược và leaderboard ngay khi admin mở Round 1.</p>
      </div>
    );
  }

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>{liveState.label}</h2>
        <div className="route-inline-actions route-inline-actions--compact">
          <span className={stagePill.tone}>{stagePill.label}</span>
          {liveState.stage === ROUND1_LIVE_STAGES.BETTING ? (
            <span className="route-status-pill">Hết giờ sẽ tự khóa cược</span>
          ) : null}
        </div>
        <p>{getStageCopy(liveState.stage)}</p>
        {liveState.countdownSeconds ? (
          <div className="route-presenter-timer">
            <span className="route-status-pill route-status-pill--warning">Đếm ngược</span>
            <Timer
              seconds={liveState.countdownSeconds}
              endsAt={liveState.countdownEndsAt}
              paused={false}
              onExpire={() => {}}
            />
          </div>
        ) : null}
        {question ? (
          <div className="route-inline-actions route-inline-actions--compact">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setIsZoomOpen(true)}
            >
              Phóng to câu hỏi
            </button>
          </div>
        ) : null}
        {question ? (
          <>
            <p className="route-round1-question">{question.text}</p>
            <div className="route-round1-options">
              {question.options.map((option) => {
                const isCorrect =
                  liveState.stage === ROUND1_LIVE_STAGES.REVEAL &&
                  option.label === liveState.correctOption;

                return (
                  <div
                    className={`route-round1-option ${isCorrect ? 'route-round1-option--correct' : ''}`}
                    key={option.label}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.text}</span>
                  </div>
                );
              })}
            </div>
            {liveState.stage === ROUND1_LIVE_STAGES.REVEAL ? (
              <p className="route-phase-success">
                Đáp án đúng: {question.correct} · {question.answer}
              </p>
            ) : null}
          </>
        ) : (
          <p>Admin chưa chọn câu hỏi hiện tại cho Round 1.</p>
        )}
        {error ? <p className="route-error-text">{error}</p> : null}
      </div>

      <FocusModal
        open={isZoomOpen}
        title={liveState.label || 'Round 1'}
        subtitle={question ? `Câu ${liveState.questionIndex + 1}` : ''}
        onClose={() => setIsZoomOpen(false)}
      >
        {question ? (
          <div className="route-zoom-copy">
            <p className="route-zoom-question">{question.text}</p>
            <div className="route-zoom-options">
              {question.options.map((option) => {
                const isCorrect =
                  liveState.stage === ROUND1_LIVE_STAGES.REVEAL &&
                  option.label === liveState.correctOption;

                return (
                  <div
                    className={`route-zoom-option ${isCorrect ? 'route-zoom-option--correct' : ''}`}
                    key={option.label}
                  >
                    <strong>{option.label}</strong>
                    <span>{option.text}</span>
                  </div>
                );
              })}
            </div>
            {liveState.stage === ROUND1_LIVE_STAGES.REVEAL ? (
              <p className="route-phase-success">
                Đáp án đúng: {question.correct} · {question.answer}
              </p>
            ) : null}
          </div>
        ) : null}
      </FocusModal>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Leaderboard Tạm Thời</h2>
        <div className="route-round1-list">
          {scores.map((score, index) => (
            <div className="route-round1-row" key={score.id}>
              <div>
                <strong>
                  #{index + 1} {score.teams?.icon || '🏢'} {score.teams?.display_name || 'Đội'}
                </strong>
                <p className="route-muted-text">
                  Token: {score.round1_tokens} · Điểm Round 1: {score.round1_score}
                </p>
              </div>
              <div className="route-status-pill route-status-pill--success">
                {score.total_score} điểm
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
