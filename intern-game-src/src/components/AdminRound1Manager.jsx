import { useEffect, useMemo, useState, useTransition } from 'react';
import { TEAMS } from '../data/teams';
import { ROUND1_QUESTIONS } from '../data/round1Questions';
import {
  getAdminRound1Snapshot,
  LIVE_REFRESH_INTERVAL_MS,
} from '../lib/game-backend';
import {
  adminMarkRound1Bet,
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

export default function AdminRound1Manager({ phase }) {
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
  const [isPending, startTransition] = useTransition();

  const selectedQuestion =
    ROUND1_QUESTIONS[selectedQuestionIndex] || ROUND1_QUESTIONS[0];

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
    let alive = true;

    async function load() {
      try {
        setLoading(true);
        const snapshot = await getAdminRound1Snapshot(selectedQuestionIndex);

        if (!alive) return;
        setBets(snapshot.bets || []);
        setScores(snapshot.leaderboard || []);
        setError('');
      } catch (nextError) {
        if (!alive) return;
        setError(nextError?.message || 'Không tải được dữ liệu Round 1.');
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
  }, [selectedQuestionIndex]);

  function handleSetStage(stage) {
    startTransition(async () => {
      try {
        setError('');
        setMessage('');
        await adminSetRound1State({
          questionIndex: selectedQuestionIndex,
          stage,
          revealCorrectOption:
            stage === ROUND1_LIVE_STAGES.REVEAL ? selectedQuestion.correct : null,
        });
        setMessage(`Đã chuyển Round 1 sang trạng thái: ${getStageLabel(stage)}.`);
      } catch (nextError) {
        setError(nextError?.message || 'Không cập nhật được trạng thái Round 1.');
      }
    });
  }

  async function handleMark(teamCode, resolution) {
    try {
      setPendingTeamCode(teamCode);
      setError('');
      setMessage('');
      await adminMarkRound1Bet({
        teamCode,
        questionIndex: selectedQuestionIndex,
        resolution,
      });
      setMessage(
        `Đã chấm ${teamCode} là ${resolution === 'correct' ? 'đúng' : 'sai'}.`
      );
      const snapshot = await getAdminRound1Snapshot(selectedQuestionIndex);
      setBets(snapshot.bets || []);
      setScores(snapshot.leaderboard || []);
    } catch (nextError) {
      setError(nextError?.message || 'Không chấm được kết quả đội này.');
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
        </div>

        {message ? <p className="route-phase-success">{message}</p> : null}
        {error ? <p className="route-error-text">{error}</p> : null}
      </div>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Bảng Chấm Theo Đội</h2>
        <div className="route-round1-list">
          {TEAMS.map((team) => {
            const bet = betMap.get(team.id) || null;
            const score = scoreMap.get(team.id) || null;

            return (
              <div className="route-round1-row" key={team.id}>
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
                </div>
                <div className="route-inline-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleMark(team.id, 'correct')}
                    disabled={!bet || pendingTeamCode === team.id}
                  >
                    Đúng
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleMark(team.id, 'wrong')}
                    disabled={!bet || pendingTeamCode === team.id}
                  >
                    Sai
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {loading ? <p className="route-muted-text">Đang đồng bộ bảng chấm...</p> : null}
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
