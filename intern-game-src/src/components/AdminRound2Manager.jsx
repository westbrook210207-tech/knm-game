import { useEffect, useMemo, useState, useTransition } from 'react';
import { TEAMS } from '../data/teams';
import {
  getAdminRound2Snapshot,
  getSnapshotRefreshInterval,
} from '../lib/game-backend';
import {
  adminActivateRound2Team,
  adminPublishRound2Result,
  adminSetRound2Stage,
  getRound2LiveState,
  ROUND2_STAGES,
} from '../lib/supabase/round2';

function getStageLabel(stage) {
  if (stage === ROUND2_STAGES.CASE_DRAW) return 'Mở vòng 2';
  if (stage === ROUND2_STAGES.DISCUSSION) return 'Thảo luận';
  if (stage === ROUND2_STAGES.PRESENTATION) return 'Pitch';
  if (stage === ROUND2_STAGES.PUBLISHED) return 'Đã publish';
  return 'Chưa kích hoạt';
}

function getSubmissionTone(summary) {
  if (summary?.published_round2_score > 0) {
    return {
      label: 'Đã publish',
      tone: 'route-status-pill route-status-pill--success',
    };
  }

  if (summary?.is_finalized) {
    return {
      label: 'Đã finalize',
      tone: 'route-status-pill route-status-pill--warning',
    };
  }

  if ((summary?.submission_count ?? 0) > 0) {
    return {
      label: 'Đang chờ BGK',
      tone: 'route-status-pill',
    };
  }

  return {
    label: 'Chưa có điểm',
    tone: 'route-status-pill',
  };
}

export default function AdminRound2Manager({ phase, onChanged }) {
  const liveState = getRound2LiveState(phase);
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [countdownSeconds, setCountdownSeconds] = useState(
    liveState.countdownSeconds ?? 120
  );
  const [snapshotState, setSnapshotState] = useState({
    snapshot: null,
    loading: false,
    error: '',
  });
  const [message, setMessage] = useState('');
  const [pendingTeamCode, setPendingTeamCode] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof liveState.countdownSeconds === 'number' && liveState.countdownSeconds >= 0) {
      setCountdownSeconds(liveState.countdownSeconds);
    }
  }, [liveState.countdownSeconds]);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setSnapshotState((current) => ({
          ...current,
          loading: true,
          error: '',
        }));
        const snapshot = await getAdminRound2Snapshot();
        if (!alive) return;
        setSnapshotState({
          snapshot,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setSnapshotState((current) => ({
          ...current,
          loading: false,
          error: error?.message || 'Không tải được admin snapshot Round 2.',
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
  }, [pollIntervalMs]);

  const submissions = snapshotState.snapshot?.judge_submissions;
  const activeCase = snapshotState.snapshot?.active_case || null;

  const submissionMap = useMemo(() => {
    return new Map((submissions || []).map((entry) => [entry.team_code, entry]));
  }, [submissions]);

  function handleActivate(teamCode) {
    startTransition(async () => {
      try {
        setMessage('');
        setSnapshotState((current) => ({ ...current, error: '' }));
        await adminActivateRound2Team({
          teamCode,
          stage: ROUND2_STAGES.DISCUSSION,
          countdownSeconds,
        });
        await onChanged?.();
        const nextSnapshot = await getAdminRound2Snapshot();
        setSnapshotState({
          snapshot: nextSnapshot,
          loading: false,
          error: '',
        });
        setMessage(`Đã kích hoạt ${teamCode} cho Round 2.`);
      } catch (error) {
        setSnapshotState((current) => ({
          ...current,
          error: error?.message || 'Không kích hoạt được team Round 2.',
        }));
      }
    });
  }

  function handleSetStage(stage) {
    startTransition(async () => {
      try {
        setMessage('');
        setSnapshotState((current) => ({ ...current, error: '' }));
        await adminSetRound2Stage({
          stage,
          countdownSeconds: stage === ROUND2_STAGES.DISCUSSION ? countdownSeconds : null,
        });
        await onChanged?.();
        const nextSnapshot = await getAdminRound2Snapshot();
        setSnapshotState({
          snapshot: nextSnapshot,
          loading: false,
          error: '',
        });
        setMessage(`Đã chuyển Round 2 sang: ${getStageLabel(stage)}.`);
      } catch (error) {
        setSnapshotState((current) => ({
          ...current,
          error: error?.message || 'Không chuyển được stage Round 2.',
        }));
      }
    });
  }

  async function handlePublish(teamCode) {
    try {
      setPendingTeamCode(teamCode);
      setMessage('');
      setSnapshotState((current) => ({ ...current, error: '' }));
      await adminPublishRound2Result({ teamCode });
      await onChanged?.();
      const nextSnapshot = await getAdminRound2Snapshot();
      setSnapshotState({
        snapshot: nextSnapshot,
        loading: false,
        error: '',
      });
      setMessage(`Đã publish điểm Round 2 cho ${teamCode}.`);
    } catch (error) {
      setSnapshotState((current) => ({
        ...current,
        error: error?.message || 'Không publish được điểm Round 2.',
      }));
    } finally {
      setPendingTeamCode('');
    }
  }

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Điều Phối Round 2</h2>
        <p className="route-muted-text">
          Team active: <strong>{activeCase?.team?.display_name || 'chưa có'}</strong> · Stage:{' '}
          <strong>{getStageLabel(liveState.stage)}</strong>
        </p>
        <p className="route-phase-help">
          Flow chuẩn: <strong>Mở vòng 2</strong> → <strong>Bật thảo luận</strong> →{' '}
          <strong>Kích hoạt đội</strong> → BGK chấm đủ 3 người → <strong>Publish điểm</strong> →
          chuyển phase sang <strong>results</strong> khi muốn công bố chung cuộc.
        </p>
        <label className="route-input-group route-round1-timer-group">
          <span>Thời gian thảo luận (giây)</span>
          <input
            className="route-input route-round1-timer-input"
            type="number"
            min="0"
            max="900"
            step="1"
            value={countdownSeconds}
            onChange={(event) => setCountdownSeconds(Number(event.target.value) || 0)}
          />
        </label>

        <div className="route-inline-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => handleSetStage(ROUND2_STAGES.CASE_DRAW)}
            disabled={isPending}
          >
            Mở Round 2
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleSetStage(ROUND2_STAGES.DISCUSSION)}
            disabled={isPending}
          >
            Bật thảo luận
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => handleSetStage(ROUND2_STAGES.PRESENTATION)}
            disabled={isPending}
          >
            Chuyển sang pitch
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => handleSetStage(ROUND2_STAGES.PUBLISHED)}
            disabled={isPending}
          >
            Đánh dấu đã publish
          </button>
        </div>
        <p className="route-muted-text">
          Nút <strong>Bật thảo luận</strong> sẽ chạy countdown. Nút <strong>Publish điểm</strong>{' '}
          ở từng đội chỉ mở khi backend đã finalize đủ 3 BGK.
        </p>
        {message ? <p className="route-phase-success">{message}</p> : null}
        {snapshotState.error ? <p className="route-error-text">{snapshotState.error}</p> : null}
      </div>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Bảng Điều Phối Pitch</h2>
        <div className="route-round1-list">
          {TEAMS.map((team) => {
            const summary = submissionMap.get(team.id);
            const isActive = activeCase?.team?.team_code === team.id;
            const submissionTone = getSubmissionTone(summary);

            return (
              <div className="route-round1-row" key={team.id}>
                <div>
                  <strong>
                    {team.icon} {team.name}
                  </strong>
                  <p className="route-muted-text">
                    BGK đã nộp: {summary?.submission_count ?? 0}/3 · Điểm publish:{' '}
                    {summary?.published_round2_score ?? 0}
                  </p>
                  <p className="route-muted-text">
                    Trung bình tạm tính: {summary?.average_score ?? 0} · Finalized:{' '}
                    {summary?.final_score ?? 'chưa đủ 3 BGK'}
                  </p>
                </div>
                <div className="route-inline-actions">
                  <span
                    className={
                      isActive
                        ? 'route-status-pill route-status-pill--success'
                        : 'route-status-pill'
                    }
                  >
                    {isActive ? 'Đang active' : 'Chờ kích hoạt'}
                  </span>
                  <span className={submissionTone.tone}>{submissionTone.label}</span>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleActivate(team.id)}
                    type="button"
                    disabled={isPending}
                  >
                    Kích hoạt
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handlePublish(team.id)}
                    type="button"
                    disabled={!summary?.is_finalized || pendingTeamCode === team.id}
                  >
                    {pendingTeamCode === team.id ? 'Đang publish...' : 'Publish điểm'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {snapshotState.loading ? <p className="route-muted-text">Đang đồng bộ Round 2...</p> : null}
      </div>
    </>
  );
}
