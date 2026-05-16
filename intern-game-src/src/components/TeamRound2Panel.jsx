import { useEffect, useState } from 'react';
import FocusModal from './FocusModal';
import Timer from './Timer';
import Typewriter from './Typewriter';
import {
  getRound2TeamSnapshot,
  getSnapshotRefreshInterval,
} from '../lib/game-backend';
import { getRound2LiveState, ROUND2_STAGES } from '../lib/supabase/round2';
import { ROUND2_SWOT_FIELDS } from '../data/round2Scenarios';
import '../screens/Round2.css';

function getBossMessage(stage, isActiveTeam) {
  if (stage === ROUND2_STAGES.CASE_DRAW) {
    return 'Round 2 đã mở. Mỗi đội hãy nhận hồ sơ ứng viên của riêng mình và đọc thật kỹ trước khi vào thảo luận.';
  }

  if (stage === ROUND2_STAGES.DISCUSSION) {
    return isActiveTeam
      ? 'Đây là lúc đội bạn chốt góc nhìn và chuẩn bị cách pitch. Không có đáp án mẫu trên màn này đâu.'
      : 'Đội bạn vẫn có thể đọc hồ sơ của mình, nhưng hãy chờ tới lượt để bước vào phần pitch.';
  }

  if (stage === ROUND2_STAGES.PRESENTATION) {
    return isActiveTeam
      ? 'Đội bạn đang trình bày. Hãy bám vào hồ sơ ứng viên và bảo vệ lập luận thật rõ ràng.'
      : 'Một đội khác đang pitch. Đội bạn giữ hồ sơ này để tiếp tục chuẩn bị cho lượt của mình.';
  }

  if (stage === ROUND2_STAGES.PUBLISHED) {
    return 'Điểm Round 2 đã được công bố. Hãy nhìn bảng xếp hạng để biết vị trí của đội mình.';
  }

  return 'Round 2 sẽ mở khi admin kích hoạt một đội trình bày.';
}

export default function TeamRound2Panel({
  team,
  phase,
  session,
  sessionToken,
}) {
  const liveState = getRound2LiveState(phase);
  const pollIntervalMs = getSnapshotRefreshInterval(phase);
  const [snapshot, setSnapshot] = useState({
    assignedCase: null,
    isActiveTeam: false,
    submissions: [],
    error: '',
  });
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const nextSnapshot = await getRound2TeamSnapshot({
          teamCode: team.id,
          sessionToken,
        });
        if (!alive) return;
        setSnapshot({
          assignedCase: nextSnapshot.assigned_case || null,
          isActiveTeam: Boolean(nextSnapshot.is_active_team),
          submissions: nextSnapshot.judge_submissions || [],
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setSnapshot((current) => ({
          ...current,
          error: error?.message || 'Không tải được snapshot Round 2 của đội.',
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
  }, [pollIntervalMs, sessionToken, team.id]);

  if (!liveState.isRound2) {
    return (
      <div className="team-live__question-card slide-up">
        <div className="team-live__boss-panel">
          <div className="boss-avatar-lg">👔</div>
          <div className="dialog-box r1-boss-dialog">
            <div className="dialog-name">SẾP TỔNG</div>
            <div className="dialog-text">
              <Typewriter
                text="Round 2 chưa bắt đầu. Khi admin kích hoạt đội trình bày, hồ sơ ứng viên và countdown sẽ hiện ở đây."
                speed={18}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const assignedCase = snapshot.assignedCase;
  const teamSummary = snapshot.submissions.find((entry) => entry.team_code === team.id);
  const stageLabel =
    liveState.stage === ROUND2_STAGES.CASE_DRAW
      ? 'Nhận hồ sơ'
      : liveState.stage === ROUND2_STAGES.DISCUSSION
        ? 'Thảo luận nội bộ'
        : liveState.stage === ROUND2_STAGES.PRESENTATION
          ? 'Đang pitch'
          : liveState.stage === ROUND2_STAGES.PUBLISHED
            ? 'Đã công bố'
            : 'Chờ admin';

  return (
    <div className="r2-main team-live__main">
      <div className="r2-left slide-up">
        <div className="r2-file-header">
          <span className="r2-file-icon">🗂️</span>
          <div>
            <div className="r2-file-title">HỒ SƠ ỨNG VIÊN #{team.id.toUpperCase()}</div>
            <div className="r2-file-sub">
              {assignedCase
                ? `${assignedCase.candidate_name} · ${assignedCase.age} tuổi · ${assignedCase.major}`
                : `${team.name} · chờ hồ sơ`}
            </div>
          </div>
        </div>

        <div className="r2-file-body">
          {assignedCase ? <p>{assignedCase.prompt}</p> : <p>Case của đội chưa sẵn sàng.</p>}
        </div>

        <div className="r2-timer-row">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {snapshot.isActiveTeam ? 'Đồng hồ của đội bạn' : 'Đồng hồ điều phối hiện tại'}
          </span>
          {liveState.countdownSeconds ? (
            <Timer
              key={`${liveState.stage}-${liveState.countdownEndsAt || 'no-deadline'}`}
              seconds={liveState.countdownSeconds}
              endsAt={liveState.countdownEndsAt}
              paused={false}
              onExpire={() => {}}
            />
          ) : (
            <span className="route-status-pill">Không có countdown</span>
          )}
        </div>
        {assignedCase ? (
          <div className="route-inline-actions route-inline-actions--compact">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={() => setIsZoomOpen(true)}
            >
              Phóng to tình huống
            </button>
          </div>
        ) : null}
      </div>

      <div className="r2-right">
        <div className="r2-boss-strip">
          <span className="boss-avatar-sm">👔</span>
          <div className="dialog-box r2-mini-dialog">
            <div className="dialog-name" style={{ fontSize: '1rem' }}>SẾP TỔNG</div>
            <div className="dialog-text" style={{ fontSize: '0.9rem' }}>
              <Typewriter
                key={`${liveState.stage}-${snapshot.isActiveTeam}`}
                text={getBossMessage(liveState.stage, snapshot.isActiveTeam)}
                speed={18}
              />
            </div>
          </div>
        </div>

        <div className="route-info-card">
          <h2>Trạng Thái Điều Phối</h2>
          <div className="route-inline-actions">
            <span className="route-status-pill">{team.icon} {team.name}</span>
            <span
              className={
                snapshot.isActiveTeam
                  ? 'route-status-pill route-status-pill--success'
                  : 'route-status-pill'
              }
            >
              {snapshot.isActiveTeam ? 'Đội đang active' : 'Đội đang chờ'}
            </span>
            <span className="route-status-pill route-status-pill--warning">{stageLabel}</span>
          </div>
          <p className="team-live__phase-copy">
            Màn này chỉ hiển thị hồ sơ ứng viên và nhịp điều phối. Đội tự phân tích trên giấy hoặc thảo luận nội bộ, không nhập SWOT trên web.
          </p>
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
                <span className="r2-swot-label">
                  {key} — {label}
                </span>
                <span className="r2-swot-desc">{description}</span>
              </div>
              <textarea
                className="r2-swot-input"
                value=""
                placeholder={`Khung ${label} để đội tự ghi chú trên giấy hoặc thảo luận nội bộ.`}
                disabled
                readOnly
                rows={3}
              />
            </div>
          ))}
        </div>

        <div className="route-info-card">
          <h2>Theo Dõi BGK</h2>
          <div className="team-live__score-strip">
            <div className="token-badge">
              🎯 Lượt BGK đã nộp: {teamSummary?.submission_count ?? 0}/3
            </div>
            <div className="token-badge">
              🧠 Điểm Round 2 hiện tại: {teamSummary?.published_round2_score ?? 0}
            </div>
            {teamSummary?.is_finalized ? (
              <div className="token-badge">
                ✅ Đã finalize: {teamSummary.final_score} · chờ admin publish
              </div>
            ) : null}
            <div className="token-badge">
              🔐 Quyền điều khiển: {session?.status === 'active' ? 'Đang giữ' : 'Không active'}
            </div>
          </div>
        </div>

        {snapshot.error ? <p className="route-error-text">{snapshot.error}</p> : null}
      </div>

      <FocusModal
        open={isZoomOpen}
        title={
          assignedCase
            ? `${assignedCase.candidate_name} · ${assignedCase.major}`
            : `Tình huống của ${team.name}`
        }
        subtitle={`${team.icon} ${team.name}`}
        onClose={() => setIsZoomOpen(false)}
      >
        {assignedCase ? (
          <div className="route-zoom-copy">
            <p className="route-zoom-question">{assignedCase.prompt}</p>
          </div>
        ) : (
          <p>Case của đội chưa sẵn sàng.</p>
        )}
      </FocusModal>
    </div>
  );
}
