import { useEffect, useState } from 'react';
import RoleShell from '../layouts/RoleShell';
import AdminRound1Manager from '../../components/AdminRound1Manager';
import AdminPhaseControls from '../../components/AdminPhaseControls';
import AdminSessionManager from '../../components/AdminSessionManager';
import RoleIdentityCard from '../../components/RoleIdentityCard';
import RoleLoginCard from '../../components/RoleLoginCard';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';
import { useSupabaseRoleSession } from '../../hooks/useSupabaseRoleSession';
import { signInWithAccount, signOut } from '../../lib/supabase/auth';
import {
  listAdminTeamSessions,
  revokeTeamSession,
} from '../../lib/supabase/sessions';

export default function AdminRoute() {
  const phaseState = useSupabasePhase();
  const authState = useSupabaseRoleSession();
  const [loginError, setLoginError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');
  const [revokePendingId, setRevokePendingId] = useState('');

  const isAdmin = authState.profile?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return undefined;

    let alive = true;

    async function load() {
      try {
        setSessionsLoading(true);
        setSessionsError('');
        const nextSessions = await listAdminTeamSessions();
        if (!alive) return;
        setSessions(nextSessions);
      } catch (error) {
        if (!alive) return;
        setSessionsError(error?.message || 'Không tải được team sessions.');
      } finally {
        if (alive) setSessionsLoading(false);
      }
    }

    void load();

    return () => {
      alive = false;
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

  async function handleRefreshSessions() {
    try {
      setSessionsLoading(true);
      setSessionsError('');
      setSessions(await listAdminTeamSessions());
    } catch (error) {
      setSessionsError(error?.message || 'Không tải lại được team sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleRevokeSession(sessionId) {
    try {
      setRevokePendingId(sessionId);
      setSessionsError('');
      await revokeTeamSession(sessionId);
      await handleRefreshSessions();
    } catch (error) {
      setSessionsError(error?.message || 'Thu hồi session thất bại.');
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
        <SharedPhaseCard roleLabel="admin" phaseState={phaseState} />

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
          <>
            <RoleIdentityCard
              title="Danh Tính Admin"
              user={authState.user}
              profile={authState.profile}
              roleHint="Sau khi auth hợp lệ, admin có thể đổi phase và quản lý team session ngay trong shell này."
            >
              <div className="route-inline-actions">
                <button className="btn btn-danger" type="button" onClick={handleSignOut}>
                  Đăng xuất
                </button>
              </div>
            </RoleIdentityCard>
            <AdminPhaseControls phase={phaseState.phase} />
            <AdminRound1Manager phase={phaseState.phase} />
            <AdminSessionManager
              sessions={sessions}
              loading={sessionsLoading}
              error={sessionsError}
              onRefresh={handleRefreshSessions}
              onRevoke={handleRevokeSession}
              revokePendingId={revokePendingId}
            />
          </>
        )}

        <div className="route-info-card">
          <h2>Trách Nhiệm Sau Này</h2>
          <p>Điều khiển phase, mark đáp án Round 1, quản lý pitch flow, và override khi event bị kẹt.</p>
        </div>
      </div>
    </RoleShell>
  );
}
