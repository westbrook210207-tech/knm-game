import { useEffect, useState } from 'react';
import FocusModal from './FocusModal';
import Timer from './Timer';
import {
  getRound2PresenterSnapshot,
  getSnapshotRefreshInterval,
} from '../lib/game-backend';
import { getRound2LiveState, ROUND2_STAGES } from '../lib/supabase/round2';

function getStageCopy(stage) {
  if (stage === ROUND2_STAGES.CASE_DRAW) {
    return 'Round 2 vừa được mở. Các đội nhận tín hiệu bắt đầu đọc case cố định của mình.';
  }
  if (stage === ROUND2_STAGES.DISCUSSION) {
    return 'Đội đang thảo luận case và chuẩn bị pitch.';
  }

  if (stage === ROUND2_STAGES.PRESENTATION) {
    return 'Đội đang pitch trước ban giám khảo.';
  }

  if (stage === ROUND2_STAGES.PUBLISHED) {
    return 'Điểm Round 2 đã được công bố.';
  }

  return 'Đang chờ admin kích hoạt đội trình bày.';
}

export default function PresenterRound2Board({ phase }) {
  const liveState = getRound2LiveState(phase);
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [snapshot, setSnapshot] = useState({
    activeCase: null,
    submissions: [],
    leaderboard: [],
    error: '',
  });
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextSnapshot = await getRound2PresenterSnapshot();
        if (!alive) return;
        setSnapshot({
          activeCase: nextSnapshot.active_case || null,
          submissions: nextSnapshot.judge_submissions || [],
          leaderboard: nextSnapshot.leaderboard || [],
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setSnapshot((current) => ({
          ...current,
          error: error?.message || 'Không tải được presenter snapshot cho Round 2.',
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

  if (!liveState.isRound2) {
    return (
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Round 2 Chưa Được Mở</h2>
        <p>Presenter sẽ hiển thị team đang pitch, case và tiến độ BGK ngay khi admin kích hoạt Round 2.</p>
      </div>
    );
  }

  const activeTeamCode = liveState.activeTeamCode || snapshot.activeCase?.team?.team_code;
  const activeSummary = snapshot.submissions.find(
    (entry) => entry.team_code === activeTeamCode
  );

  return (
    <>
      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>{liveState.label}</h2>
        <div className="route-inline-actions route-inline-actions--compact">
          <span className="route-status-pill route-status-pill--warning">
            {getStageCopy(liveState.stage)}
          </span>
          {liveState.countdownSeconds ? (
            <Timer
              key={`${liveState.stage}-${liveState.countdownEndsAt || 'no-deadline'}`}
              seconds={liveState.countdownSeconds}
              endsAt={liveState.countdownEndsAt}
              paused={false}
              onExpire={() => {}}
            />
          ) : null}
          {snapshot.activeCase ? (
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setIsZoomOpen(true)}
            >
              Phóng to tình huống
            </button>
          ) : null}
        </div>

        {snapshot.activeCase ? (
          <div className="route-round2-case">
            <h3>
              {snapshot.activeCase.team?.icon} {snapshot.activeCase.team?.display_name} ·{' '}
              {snapshot.activeCase.candidate_name}, {snapshot.activeCase.age} tuổi
            </h3>
            <p className="route-muted-text">{snapshot.activeCase.major}</p>
            <p>{snapshot.activeCase.prompt}</p>
            <p className="route-phase-success">
              BGK đã nộp: {activeSummary?.submission_count ?? 0}/3
            </p>
            {activeSummary?.is_finalized ? (
              <p className="route-phase-success">
                Finalized: {activeSummary.final_score} điểm · chờ admin publish
              </p>
            ) : null}
          </div>
        ) : (
          <p>Admin chưa kích hoạt đội trình bày nào cho Round 2.</p>
        )}

        {snapshot.error ? <p className="route-error-text">{snapshot.error}</p> : null}
      </div>

      <FocusModal
        open={isZoomOpen}
        title={
          snapshot.activeCase
            ? `${snapshot.activeCase.team?.display_name} · ${snapshot.activeCase.candidate_name}`
            : 'Round 2'
        }
        subtitle={snapshot.activeCase?.major || ''}
        onClose={() => setIsZoomOpen(false)}
      >
        {snapshot.activeCase ? (
          <div className="route-zoom-copy">
            <p className="route-zoom-question">{snapshot.activeCase.prompt}</p>
          </div>
        ) : null}
      </FocusModal>

      <div className="route-info-card route-round1-card route-round1-card--wide">
        <h2>Leaderboard Sau Round 2</h2>
        <div className="route-round1-list">
          {snapshot.leaderboard.map((score, index) => (
            <div className="route-round1-row" key={score.id}>
              <div>
                <strong>
                  #{index + 1} {score.teams?.icon} {score.teams?.display_name}
                </strong>
                <p className="route-muted-text">
                  V1: {score.round1_score} · V2: {score.round2_score}
                </p>
              </div>
              <span className="route-status-pill route-status-pill--success">
                {score.total_score} điểm
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
