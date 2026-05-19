import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { parseCountdownEndsAt } from './Timer';
import { TEAMS } from '../data/teams';
import { ROUND1_QUESTIONS } from '../data/round1Questions';
import { getSupabaseEnv } from '../lib/supabase/env';
import {
  getAdminRound1Snapshot,
} from '../lib/game-backend';
import {
  adminMarkRound1Bet,
  adminResetGameplayState,
  adminSetRound1State,
  getRound1LiveState,
  ROUND1_LIVE_STAGES,
} from '../lib/supabase/round1';

function getResolutionLabel(resolution) {
  if (resolution === 'correct') return 'Đúng';
  if (resolution === 'wrong') return 'Sai';
  return 'Chờ chấm';
}

function getStageLabel(stage) {
  if (stage === ROUND1_LIVE_STAGES.BETTING) return 'Đang đặt cược';
  if (stage === ROUND1_LIVE_STAGES.LOCKED) return 'Đã khóa cược';
  if (stage === ROUND1_LIVE_STAGES.REVEAL) return 'Đang công bố đáp án';
  if (stage === ROUND1_LIVE_STAGES.COMPLETE) return 'Đã kết thúc vòng';
  return 'Chưa kích hoạt';
}

function keepDraftResultsForPendingBets(currentDrafts, nextBets) {
  const pendingTeamCodes = new Set(
    (nextBets || [])
      .filter((bet) => bet?.resolution === 'pending')
      .map((bet) => bet?.teams?.team_code || bet?.team_code)
      .filter(Boolean)
  );

  return Object.fromEntries(
    Object.entries(currentDrafts).filter(([teamCode]) => pendingTeamCodes.has(teamCode))
  );
}

export default function AdminRound1Manager({ phase, onChanged }) {
  const liveState = getRound1LiveState(phase);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(
    liveState.questionIndex ?? 0
  );
  const [bets, setBets] = useState([]);
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pendingTeamCode, setPendingTeamCode] = useState('');
  const [draftResults, setDraftResults] = useState({});
  const [countdownSeconds, setCountdownSeconds] = useState(
    liveState.countdownSeconds ?? 15
  );
  const [isPending, startTransition] = useTransition();
  const hasPendingBets = bets.some((bet) => bet?.resolution === 'pending');
  const { eventSlug } = getSupabaseEnv();
  const autoLockedKeyRef = useRef('');

  const selectedQuestion =
    ROUND1_QUESTIONS[selectedQuestionIndex] || ROUND1_QUESTIONS[0];
  const draftCount = Object.keys(draftResults).length;

  const betMap = useMemo(() => {
    return new Map(
      bets.map((bet) => [bet.teams?.team_code || bet.team_code || bet.team_id, bet])
    );
  }, [bets]);

  const scoreMap = useMemo(() => {
    return new Map(
      scores.map((score) => [
        score.teams?.team_code || score.team_code || score.team_id,
        score,
      ])
    );
  }, [scores]);

  useEffect(() => {
    if (typeof liveState.questionIndex === 'number') {
      setSelectedQuestionIndex(liveState.questionIndex);
    }
  }, [liveState.questionIndex]);

  useEffect(() => {
    if (typeof liveState.countdownSeconds === 'number' && liveState.countdownSeconds >= 0) {
      setCountdownSeconds(liveState.countdownSeconds);
    }
  }, [liveState.countdownSeconds]);

  const loadRound1Snapshot = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getAdminRound1Snapshot(selectedQuestionIndex);
      setBets(snapshot.bets || []);
      setScores(snapshot.leaderboard || []);
      setDraftResults((current) =>
        keepDraftResultsForPendingBets(current, snapshot.bets || [])
      );
      setError('');
    } catch (nextError) {
      setError(nextError?.message || 'Không tải được dữ liệu Round 1.');
    } finally {
      setLoading(false);
    }
  }, [selectedQuestionIndex]);

  useEffect(() => {
    void loadRound1Snapshot();
  }, [loadRound1Snapshot]);

  const handleSetStage = useCallback((stage) => {
    startTransition(async () => {
      try {
        setError('');
        setMessage('');
        await adminSetRound1State({
          questionIndex: selectedQuestionIndex,
          stage,
          revealCorrectOption:
            stage === ROUND1_LIVE_STAGES.REVEAL ? selectedQuestion.correct : null,
          countdownSeconds:
            stage === ROUND1_LIVE_STAGES.BETTING
              ? countdownSeconds
              : null,
        });
        await onChanged?.();
        setMessage(`Đã chuyển Round 1 sang trạng thái: ${getStageLabel(stage)}.`);
      } catch (nextError) {
        setError(nextError?.message || 'Không cập nhật được trạng thái Round 1.');
      }
    });
  }, [countdownSeconds, onChanged, selectedQuestion.correct, selectedQuestionIndex, startTransition]);

  useEffect(() => {
    if (liveState.stage !== ROUND1_LIVE_STAGES.BETTING || !liveState.countdownEndsAt) {
      autoLockedKeyRef.current = '';
      return undefined;
    }

    const autoLockKey = `${liveState.questionIndex ?? 'none'}:${liveState.countdownEndsAt}`;
    if (autoLockedKeyRef.current === autoLockKey) {
      return undefined;
    }

    const deadlineMs = parseCountdownEndsAt(liveState.countdownEndsAt);
    if (deadlineMs === null) {
      return undefined;
    }
    const delayMs = Math.max(0, deadlineMs - Date.now());

    const timeoutId = window.setTimeout(() => {
      if (autoLockedKeyRef.current === autoLockKey) return;
      autoLockedKeyRef.current = autoLockKey;
      handleSetStage(ROUND1_LIVE_STAGES.LOCKED);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    handleSetStage,
    liveState.countdownEndsAt,
    liveState.questionIndex,
    liveState.stage,
  ]);

  function handlePickResult(teamCode, resolution) {
    setError('');
    setMessage('');
    setDraftResults((current) => ({
      ...current,
      [teamCode]: resolution,
    }));
  }

  function handleClearDraft(teamCode) {
    setDraftResults((current) => {
      const next = { ...current };
      delete next[teamCode];
      return next;
    });
  }

  function handleBulkMark(resolution) {
    const pendingBets = bets.filter((bet) => bet?.resolution === 'pending');

    if (!pendingBets.length) {
      setMessage('');
      setError('Không có cược pending nào để chấm nhanh.');
      return;
    }

    setError('');
    setMessage(
      resolution === 'correct'
        ? 'Đã chọn tạm tất cả cược pending là đúng. Hãy kiểm tra lại rồi bấm Nộp kết quả.'
        : 'Đã chọn tạm tất cả cược pending là sai. Hãy kiểm tra lại rồi bấm Nộp kết quả.'
    );
    setDraftResults((current) => {
      const next = { ...current };
      pendingBets.forEach((bet) => {
        const teamCode = bet.teams?.team_code || bet.team_code;
        if (teamCode) next[teamCode] = resolution;
      });
      return next;
    });
  }

  async function handleSubmitResults() {
    const entries = Object.entries(draftResults);

    if (!entries.length) {
      setMessage('');
      setError('Chưa có kết quả tạm nào để nộp.');
      return;
    }

    try {
      setPendingTeamCode('submit');
      setError('');
      setMessage('');
      await Promise.all(
        entries.map(([teamCode, resolution]) =>
          adminMarkRound1Bet({
            teamCode,
            questionIndex: selectedQuestionIndex,
            resolution,
          })
        )
      );
      await onChanged?.();
      await loadRound1Snapshot();
      setDraftResults({});
      setMessage(`Đã nộp ${entries.length} kết quả chấm cho câu ${selectedQuestionIndex + 1}.`);
    } catch (nextError) {
      setError(nextError?.message || 'Không nộp được kết quả chấm.');
    } finally {
      setPendingTeamCode('');
    }
  }

  async function handleResetGameplay() {
    const accepted = window.confirm(
      'Reset dữ liệu chơi sẽ xóa cược Round 1, reset token/điểm và thu hồi toàn bộ team session. Bạn có chắc không?'
    );

    if (!accepted) return;

    try {
      setPendingTeamCode('reset');
      setError('');
      setMessage('');
      await adminResetGameplayState(eventSlug);
      await onChanged?.();
      await loadRound1Snapshot();
      setMessage('Đã reset dữ liệu chơi về trạng thái lobby an toàn.');
    } catch (nextError) {
      setError(nextError?.message || 'Không reset được dữ liệu chơi.');
    } finally {
      setPendingTeamCode('');
    }
  }

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Điều Phối Round 1</h2>
        <p>
          Câu hiện tại: <strong>{selectedQuestionIndex + 1}</strong> · Trạng thái:{' '}
          <strong>{getStageLabel(liveState.stage)}</strong>
        </p>
        <p className="route-muted-text">{selectedQuestion?.text}</p>

        <label className="route-form__group route-round1-timer-group">
          <span>Countdown (giây)</span>
          <input
            className="route-input route-round1-timer-input"
            type="number"
            min="0"
            max="600"
            step="1"
            value={countdownSeconds}
            onChange={(event) => setCountdownSeconds(Number(event.target.value) || 0)}
          />
        </label>

        <div className="route-phase-list">
          {ROUND1_QUESTIONS.map((question, index) => (
            <button
              key={question.id}
              type="button"
              className={
                index === selectedQuestionIndex
                  ? 'btn btn-primary route-phase-button'
                  : 'btn btn-ghost route-phase-button'
              }
              onClick={() => setSelectedQuestionIndex(index)}
              disabled={isPending}
            >
              Câu {index + 1}
            </button>
          ))}
        </div>

        <div className="route-inline-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setMessage('');
              void loadRound1Snapshot();
            }}
            disabled={loading || pendingTeamCode === 'submit'}
          >
            {loading ? 'Đang làm mới...' : 'Làm mới danh sách'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSetStage(ROUND1_LIVE_STAGES.BETTING)}
            disabled={isPending}
          >
            Mở đặt cược
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => handleSetStage(ROUND1_LIVE_STAGES.LOCKED)}
            disabled={isPending}
          >
            Khóa cược
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => handleSetStage(ROUND1_LIVE_STAGES.REVEAL)}
            disabled={isPending}
          >
            Công bố đáp án
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleSetStage(ROUND1_LIVE_STAGES.COMPLETE)}
            disabled={isPending}
          >
            Kết thúc Round 1
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleResetGameplay}
            disabled={pendingTeamCode === 'reset'}
          >
            {pendingTeamCode === 'reset' ? 'Đang reset...' : 'Reset dữ liệu chơi'}
          </button>
        </div>

        {message ? <p className="route-phase-success">{message}</p> : null}
        {error ? <p className="route-error-text">{error}</p> : null}
      </div>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Bảng Chấm Theo Đội</h2>
        <div className="route-inline-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleBulkMark('correct')}
            disabled={!hasPendingBets || pendingTeamCode === 'submit'}
          >
            Tất cả đúng
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleBulkMark('wrong')}
            disabled={!hasPendingBets || pendingTeamCode === 'submit'}
          >
            Tất cả sai
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setDraftResults({});
              setMessage('');
              setError('');
            }}
            disabled={!draftCount || pendingTeamCode === 'submit'}
          >
            Xóa chọn tạm
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmitResults}
            disabled={!draftCount || pendingTeamCode === 'submit'}
          >
            {pendingTeamCode === 'submit' ? 'Đang nộp...' : `Nộp kết quả (${draftCount})`}
          </button>
        </div>
        <p className="route-muted-text">
          Bảng chấm này không tự poll liên tục. Hãy bấm <strong>Làm mới danh sách</strong> trước khi chấm nếu bạn muốn kéo snapshot mới nhất từ backend.
        </p>
        <div className="route-round1-list">
          {TEAMS.map((team) => {
            const bet = betMap.get(team.id) || null;
            const score = scoreMap.get(team.id) || null;
            const draftResolution = draftResults[team.id] || null;
            const isResolved = bet?.resolution && bet.resolution !== 'pending';
            const rowClassName = [
              'route-round1-row',
              draftResolution === 'correct' ? 'route-round1-row--draft-correct' : '',
              draftResolution === 'wrong' ? 'route-round1-row--draft-wrong' : '',
              bet?.resolution === 'correct' ? 'route-round1-row--resolved-correct' : '',
              bet?.resolution === 'wrong' ? 'route-round1-row--resolved-wrong' : '',
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div className={rowClassName} key={team.id}>
                <div>
                  <strong>
                    {team.icon} {team.name}
                  </strong>
                  <p className="route-muted-text">
                    {bet
                      ? `Đã cược ${bet.bet_amount} token · ${getResolutionLabel(
                          bet.resolution
                        )}`
                      : 'Chưa có bet cho câu này'}
                  </p>
                  <p className="route-muted-text">
                    Token: {score?.round1_tokens ?? 10} · Điểm Round 1:{' '}
                    {score?.round1_score ?? 3}
                  </p>
                  {draftResolution ? (
                    <p className="route-phase-success">
                      Chọn tạm: {draftResolution === 'correct' ? 'Đúng' : 'Sai'}
                    </p>
                  ) : isResolved ? (
                    <p className="route-muted-text">
                      Đã chấm thật: {bet?.resolution === 'correct' ? 'Đúng' : 'Sai'}
                    </p>
                  ) : null}
                </div>
                <div
                  className={`route-inline-actions ${
                    isResolved ? 'route-inline-actions--resolved' : ''
                  }`}
                >
                  <button
                    type="button"
                    className={`btn btn-primary route-round1-action-button ${
                      draftResolution === 'correct' ? 'route-round1-action-button--active' : ''
                    }`}
                    onClick={() => handlePickResult(team.id, 'correct')}
                    disabled={!bet || isResolved || pendingTeamCode === 'submit'}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    className={`btn btn-danger route-round1-action-button ${
                      draftResolution === 'wrong' ? 'route-round1-action-button--active' : ''
                    }`}
                    onClick={() => handlePickResult(team.id, 'wrong')}
                    disabled={!bet || isResolved || pendingTeamCode === 'submit'}
                  >
                    Sai
                  </button>
                  <button
                    type="button"
                    className={`btn btn-ghost route-round1-action-button ${
                      !draftResolution && !isResolved ? 'route-round1-action-button--muted' : ''
                    }`}
                    onClick={() => handleClearDraft(team.id)}
                    disabled={!draftResolution || pendingTeamCode === 'submit'}
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className={`route-muted-text route-sync-status ${loading ? 'route-sync-status--active' : ''}`}>
          {loading ? 'Đang đồng bộ bảng chấm...' : ' '}
        </p>
      </div>

      <div className="route-info-card route-round1-card">
        <h2>Đáp Án Chuẩn</h2>
        <p>
          <strong>{selectedQuestion.correct}</strong> · {selectedQuestion.answer}
        </p>
      </div>
    </>
  );
}
