import { useEffect, useState } from 'react';
import {
  getRound2JudgeSnapshot,
  getSnapshotRefreshInterval,
} from '../lib/game-backend';
import {
  getRound2LiveState,
  submitRound2JudgeScore,
} from '../lib/supabase/round2';

const RUBRICS = [
  {
    key: 'analysisScore',
    label: 'Phân tích SWOT',
    max: 2,
    description:
      'Đánh giá độ sắc nét của cách bóc tách strengths, weaknesses, opportunities, threats.',
  },
  {
    key: 'strategyScore',
    label: 'Logic và đề xuất',
    max: 2,
    description:
      'Đánh giá tính hợp lý của hướng giải quyết và độ chặt chẽ trong lập luận.',
  },
  {
    key: 'deliveryScore',
    label: 'Trình bày',
    max: 1,
    description:
      'Đánh giá sự rõ ràng, tự tin và khả năng truyền tải của đội.',
  },
];

export default function JudgeRound2Panel({
  judgeId,
  phase,
  sessionToken,
  onSessionInvalid,
}) {
  const liveState = getRound2LiveState(phase);
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [snapshot, setSnapshot] = useState({
    activeCase: null,
    currentSubmission: null,
    submissions: [],
    error: '',
  });
  const [form, setForm] = useState({
    analysisScore: null,
    strategyScore: null,
    deliveryScore: null,
    notes: '',
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextSnapshot = await getRound2JudgeSnapshot({
          judgeCode: judgeId,
          sessionToken,
        });
        if (!alive) return;
        setSnapshot({
          activeCase: nextSnapshot.active_case || null,
          currentSubmission: nextSnapshot.current_submission || null,
          submissions: nextSnapshot.judge_submissions || [],
          error: '',
        });
        if (nextSnapshot.current_submission) {
          setForm({
            analysisScore: nextSnapshot.current_submission.analysis_score,
            strategyScore: nextSnapshot.current_submission.strategy_score,
            deliveryScore: nextSnapshot.current_submission.delivery_score,
            notes: nextSnapshot.current_submission.notes || '',
          });
        } else {
          setForm({
            analysisScore: null,
            strategyScore: null,
            deliveryScore: null,
            notes: '',
          });
        }
      } catch (error) {
        if (error?.message?.includes('Invalid judge session.')) {
          onSessionInvalid?.();
          return;
        }
        if (!alive) return;
        setSnapshot((current) => ({
          ...current,
          error: error?.message || 'Không tải được judge snapshot.',
        }));
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
  }, [judgeId, onSessionInvalid, pollIntervalMs, sessionToken]);

  async function handleSubmit(event) {
    event.preventDefault();

    const hasMissingScore = RUBRICS.some((rubric) => form[rubric.key] === null);
    if (hasMissingScore) {
      setSnapshot((current) => ({
        ...current,
        error: 'Vui lòng chọn đủ điểm cho cả 3 tiêu chí trước khi nộp.',
      }));
      return;
    }

    try {
      setPending(true);
      setMessage('');
      setSnapshot((current) => ({ ...current, error: '' }));
      const nextSnapshot = await submitRound2JudgeScore({
        judgeCode: judgeId,
        sessionToken,
        analysisScore: form.analysisScore,
        strategyScore: form.strategyScore,
        deliveryScore: form.deliveryScore,
        notes: form.notes,
      });
      setSnapshot({
        activeCase: nextSnapshot.active_case || null,
        currentSubmission: nextSnapshot.current_submission || null,
        submissions: nextSnapshot.judge_submissions || [],
        error: '',
      });
      setMessage('Đã ghi nhận điểm Round 2 của BGK.');
    } catch (error) {
      if (error?.message?.includes('Invalid judge session.')) {
        onSessionInvalid?.();
        return;
      }
      setSnapshot((current) => ({
        ...current,
        error: error?.message || 'Không nộp được điểm Round 2.',
      }));
    } finally {
      setPending(false);
    }
  }

  const activeSummary = snapshot.submissions.find(
    (entry) => entry.team_code === snapshot.activeCase?.team?.team_code
  );
  const submittedCount = activeSummary?.submission_count ?? 0;
  const totalScore = RUBRICS.reduce(
    (sum, rubric) => sum + Number(form[rubric.key] || 0),
    0
  );
  const isFormComplete = RUBRICS.every((rubric) => form[rubric.key] !== null);

  return (
    <div className="route-info-card route-round1-card route-round1-card--wide judge-scorecard">
      <div className="judge-scorecard__header">
        <div>
          <p className="judge-scorecard__eyebrow">RUBRIC CHẤM</p>
          <h2 className="judge-scorecard__title">NHẬP ĐIỂM THEO 3 TIÊU CHÍ</h2>
        </div>
        <div className="judge-scorecard__progress">{submittedCount}/3 ĐÃ GỬI</div>
      </div>

      <p className="route-muted-text judge-scorecard__subhead">
        Stage hiện tại: {liveState.stage || 'idle'} · Team active:{' '}
        {snapshot.activeCase?.team?.display_name || 'chưa có'}
      </p>

      {snapshot.activeCase ? (
        <>
          <div className="judge-scorecard__case">
            <strong>
              {snapshot.activeCase.team?.icon} {snapshot.activeCase.team?.display_name}
            </strong>{' '}
            · {snapshot.activeCase.candidate_name}, {snapshot.activeCase.age} tuổi
          </div>
          <p className="judge-scorecard__prompt">{snapshot.activeCase.prompt}</p>

          <form className="judge-scorecard__rubrics" onSubmit={handleSubmit}>
            {RUBRICS.map((rubric) => (
              <section className="judge-rubric-card" key={rubric.key}>
                <div className="judge-rubric-card__head">
                  <div>
                    <h3>{rubric.label}</h3>
                    <p>{rubric.description}</p>
                  </div>
                  <span className="judge-rubric-card__current">
                    {Number.isFinite(form[rubric.key]) ? form[rubric.key] : '-'}
                  </span>
                </div>

                <div className="judge-rubric-card__choices">
                  {Array.from({ length: rubric.max + 1 }, (_, score) => (
                    <button
                      key={`${rubric.key}-${score}`}
                      className={`judge-score-button ${
                        form[rubric.key] === score ? 'judge-score-button--active' : ''
                      }`}
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          [rubric.key]: score,
                        }))
                      }
                    >
                      {score}
                    </button>
                  ))}
                </div>
              </section>
            ))}

            <label className="route-input-group judge-scorecard__notes">
              <span>Nhận xét nhanh</span>
              <textarea
                className="route-input"
                rows="4"
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Ghi chú ngắn cho phần chấm điểm của BGK"
              />
            </label>

            <div className="judge-scorecard__footer">
              <div className="judge-scorecard__summary">
                <span className="route-status-pill route-status-pill--warning">
                  Thang điểm 2-2-1
                </span>
                <span className="route-status-pill">Tổng hiện tại: {totalScore}/5</span>
              </div>
              <button
                className="btn btn-primary"
                disabled={pending || !isFormComplete}
                type="submit"
              >
                {pending ? 'Đang gửi...' : 'Nộp điểm'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <p>Admin chưa kích hoạt đội trình bày nào, nên BGK chưa có case để chấm.</p>
      )}

      {message ? <p className="route-phase-success">{message}</p> : null}
      {snapshot.error ? <p className="route-error-text">{snapshot.error}</p> : null}
    </div>
  );
}
