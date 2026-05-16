import { useEffect, useState } from 'react';
import RoleShell from '../layouts/RoleShell';
import AdminRound1Manager from '../../components/AdminRound1Manager';
import AdminRound2Manager from '../../components/AdminRound2Manager';
import AdminResultsPanel from '../../components/AdminResultsPanel';
import AdminPhaseControls from '../../components/AdminPhaseControls';
import AdminSessionManager from '../../components/AdminSessionManager';
import RoleIdentityCard from '../../components/RoleIdentityCard';
import RoleLoginCard from '../../components/RoleLoginCard';
import { useSupabaseRoleSession } from '../../hooks/useSupabaseRoleSession';
import { signInWithAccount, signOut } from '../../lib/supabase/auth';
import {
  getAdminControlSnapshot,
  LIVE_REFRESH_INTERVAL_MS,
} from '../../lib/game-backend';
import {
  revokeTeamSession,
} from '../../lib/supabase/sessions';

export default function AdminRoute() {
  const authState = useSupabaseRoleSession();
  const [loginError, setLoginError] = useState('');
  const [controlState, setControlState] = useState({
    snapshot: null,
    loading: false,
    error: '',
  });
  const [revokePendingId, setRevokePendingId] = useState('');

  const isAdmin = authState.profile?.role === 'admin';
  const snapshot = controlState.snapshot;
  const sessions = snapshot?.sessions || [];
  const phase = snapshot?.phase || {
    current_phase: 'lobby',
    phase_payload: { label: 'Lobby' },
    current_question_index: null,
    phase_version: 0,
  };
  const summary = snapshot?.summary || null;

  useEffect(() => {
    if (!isAdmin) return undefined;

    let alive = true;
    let intervalId = null;

    async function loadSnapshot() {
      try {
        setControlState((current) => ({
          ...current,
          loading: true,
          error: '',
        }));
        const nextSnapshot = await getAdminControlSnapshot();
        if (!alive) return;
        setControlState({
          snapshot: nextSnapshot,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setControlState((current) => ({
          ...current,
          loading: false,
          error: error?.message || 'Không tải được admin control snapshot.',
        }));
      }
    }

    void loadSnapshot();
    intervalId = window.setInterval(() => {
      void loadSnapshot();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      alive = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [isAdmin]);

  async function handleLogin({ identifier, password }) {
    try {
      setLoginError('');
      await signInWithAccount({ identifier, password });
    } catch (error) {
      setLoginError(error?.message || 'Đăng nhập admin thất bại.');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  async function handleRefreshControl() {
    try {
      setControlState((current) => ({
        ...current,
        loading: true,
        error: '',
      }));
      const nextSnapshot = await getAdminControlSnapshot();
      setControlState({
        snapshot: nextSnapshot,
        loading: false,
        error: '',
      });
    } catch (error) {
      setControlState((current) => ({
        ...current,
        loading: false,
        error: error?.message || 'Không tải lại được control snapshot.',
      }));
    }
  }

  async function handleRevokeSession(sessionId) {
    try {
      setRevokePendingId(sessionId);
      setControlState((current) => ({
        ...current,
        error: '',
      }));
      await revokeTeamSession(sessionId);
      await handleRefreshControl();
    } catch (error) {
      setControlState((current) => ({
        ...current,
        error: error?.message || 'Thu hồi session thất bại.',
      }));
    } finally {
      setRevokePendingId('');
    }
  }

  return (
    <RoleShell
      eyebrow="BẢNG ĐIỀU PHỐI"
      title="ADMIN"
      subtitle="Bảng điều phối cho role admin. Từ phase 004, route này đã có auth, phase control và session revoke ở mức vận hành demo."
      badge="Admin"
    >
      <div className="route-info-grid">
        {!authState.user ? (
          <RoleLoginCard
            title="Đăng Nhập Admin"
            description="Đăng nhập bằng tài khoản có role `admin` để được cấp quyền đổi phase và revoke session."
            accentLabel="Tài khoản phase 004: admin"
            loading={authState.loading}
            error={loginError || authState.error}
            inputLabel="Tài khoản"
            inputPlaceholder="Nhập `admin`"
            defaultIdentifier="admin"
            onSubmit={handleLogin}
          />
        ) : !isAdmin ? (
          <div className="route-info-card">
            <h2>Không Được Truy Cập</h2>
            <p>Tài khoản hiện tại đã đăng nhập nhưng không có role `admin`.</p>
            <button className="btn btn-danger" type="button" onClick={handleSignOut}>
              Đăng xuất
            </button>
          </div>
        ) : (
          <div className="route-admin-layout">
            <aside className="route-admin-sidebar">
              <RoleIdentityCard
                title="Danh Tính Admin"
                user={authState.user}
                profile={authState.profile}
                roleHint="Bạn đang ở chế độ control room. Mọi mutate sẽ đi qua RPC admin và tự refetch snapshot."
              >
                <div className="route-inline-actions">
                  <button className="btn btn-ghost" type="button" onClick={handleRefreshControl}>
                    Làm mới snapshot
                  </button>
                  <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                    Đăng xuất
                  </button>
                </div>
              </RoleIdentityCard>

              <div className="route-info-card">
                <h2>Liên Kết Điều Hướng</h2>
                <div className="route-admin-links">
                  <a className="route-inline-link" href="/">
                    Sảnh công khai
                  </a>
                  <a className="route-inline-link" href="/presenter">
                    Presenter
                  </a>
                  <a className="route-inline-link" href="/team/finance">
                    Team mẫu
                  </a>
                  <a className="route-inline-link" href="/judge/judge-1">
                    Judge 1
                  </a>
                </div>
              </div>

              <div className="route-info-card">
                <h2>Snapshot Hệ Thống</h2>
                <div className="route-admin-stats">
                  <p>
                    Phase: <strong>{phase.current_phase}</strong>
                  </p>
                  <p>
                    Stage: <strong>{summary?.currentStage || 'idle'}</strong>
                  </p>
                  <p>
                    Câu hiện tại:{' '}
                    <strong>
                      {typeof summary?.currentQuestionIndex === 'number'
                        ? `Q${summary.currentQuestionIndex + 1}`
                        : 'chưa chọn'}
                    </strong>
                  </p>
                  <p>
                    Phiên bản phase: <strong>{phase.phase_version ?? 0}</strong>
                  </p>
                  <p>
                    Session active: <strong>{summary?.activeSessionCount ?? 0}</strong>
                  </p>
                  <p>
                    Session revoked: <strong>{summary?.revokedSessionCount ?? 0}</strong>
                  </p>
                  <p>
                    Bet câu hiện tại: <strong>{summary?.betCountForCurrentQuestion ?? 0}</strong>
                  </p>
                  <p>
                    Đã chấm: <strong>{summary?.resolvedBetCountForCurrentQuestion ?? 0}</strong>
                  </p>
                </div>
                {summary?.topTeam?.teams ? (
                  <p className="route-muted-text">
                    Đội dẫn đầu: {summary.topTeam.teams.icon} {summary.topTeam.teams.display_name} ·{' '}
                    {summary.topTeam.total_score} điểm / {summary.topTeam.round1_tokens} token
                  </p>
                ) : null}
                {phase.phase_payload?.label ? (
                  <p className="route-muted-text">Thông điệp phase: {phase.phase_payload.label}</p>
                ) : null}
                {controlState.error ? (
                  <p className="route-error-text">{controlState.error}</p>
                ) : null}
              </div>

              <AdminSessionManager
                sessions={sessions}
                loading={controlState.loading}
                error={controlState.error}
                onRefresh={handleRefreshControl}
                onRevoke={handleRevokeSession}
                revokePendingId={revokePendingId}
              />
            </aside>

            <div className="route-admin-main">
              <AdminPhaseControls
                phase={phase}
                summary={summary}
                onChanged={handleRefreshControl}
              />
              <AdminRound1Manager phase={phase} onChanged={handleRefreshControl} />
              <AdminRound2Manager phase={phase} onChanged={handleRefreshControl} />
              <AdminResultsPanel snapshot={snapshot} />

              <div className="route-info-card">
                <h2>Điểm Neo Cho Spec Sau</h2>
                <p>
                  Control room này đã được chỉnh theo hướng operator-first: phase tổng quát, snapshot hệ
                  thống, team sessions, Round 1 orchestration và Round 2 activation/publish. Bước sau cùng
                  sẽ là polish flow BGK và presenter để buổi event chạy mượt hơn nữa.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="route-info-card">
          <h2>Trách Nhiệm Sau Này</h2>
          <p>Điều khiển phase, mark đáp án Round 1, quản lý pitch flow, và override khi event bị kẹt.</p>
        </div>
      </div>
    </RoleShell>
  );
}
