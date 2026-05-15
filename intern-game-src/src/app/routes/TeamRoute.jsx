import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TEAMS } from '../../data/teams';
import '../../screens/Round1.css';
import RoleShell from '../layouts/RoleShell';
import RoleIdentityCard from '../../components/RoleIdentityCard';
import RoleLoginCard from '../../components/RoleLoginCard';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import TeamSessionCard from '../../components/TeamSessionCard';
import TeamRound1Panel from '../../components/TeamRound1Panel';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';
import { useSupabaseRoleSession } from '../../hooks/useSupabaseRoleSession';
import { signInWithAccount, signOut } from '../../lib/supabase/auth';
import {
  getDeviceFingerprint,
  getDeviceLabel,
  resetDeviceFingerprint,
} from '../../lib/supabase/device';
import {
  LIVE_REFRESH_INTERVAL_MS,
} from '../../lib/game-backend';
import {
  claimTeamSession,
  getCurrentDeviceTeamSession,
} from '../../lib/supabase/sessions';

export default function TeamRoute() {
  const { teamId } = useParams();
  const team = TEAMS.find((entry) => entry.id === teamId);
  const phaseState = useSupabasePhase();
  const authState = useSupabaseRoleSession();
  const [loginError, setLoginError] = useState('');
  const [sessionState, setSessionState] = useState({
    session: null,
    loading: false,
    error: '',
  });
  const [resetPending, setResetPending] = useState(false);

  const [deviceFingerprint, setDeviceFingerprint] = useState(() =>
    getDeviceFingerprint()
  );
  const deviceLabel = useMemo(() => getDeviceLabel(), []);
  const isExpectedTeamUser =
    authState.profile?.role === 'team' && authState.profile?.team_id;

  useEffect(() => {
    if (!team || !isExpectedTeamUser) return undefined;

    let alive = true;
    let intervalId = null;

    async function syncCurrentDeviceSession() {
      try {
        if (alive) {
          setSessionState((current) => ({
            ...current,
            loading: true,
            error: '',
          }));
        }

        const nextSession =
          (await getCurrentDeviceTeamSession(
            authState.profile.team_id,
            deviceFingerprint
          )) ||
          (await claimTeamSession({
            teamId,
            deviceLabel,
            deviceFingerprint,
          }));

        if (!alive) return;

        setSessionState({
          session: nextSession,
          loading: false,
          error: '',
        });
      } catch (error) {
        if (!alive) return;
        setSessionState({
          session: null,
          loading: false,
          error: error?.message || 'Không đồng bộ được team session.',
        });
      }
    }

    void syncCurrentDeviceSession();
    intervalId = window.setInterval(() => {
      void syncCurrentDeviceSession();
    }, LIVE_REFRESH_INTERVAL_MS);

    return () => {
      alive = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [
    authState.profile?.team_id,
    deviceFingerprint,
    deviceLabel,
    isExpectedTeamUser,
    team,
    teamId,
  ]);

  async function handleLogin({ identifier, password }) {
    try {
      setLoginError('');
      await signInWithAccount({ identifier, password });
    } catch (error) {
      setLoginError(error?.message || 'Đăng nhập team thất bại.');
    }
  }

  async function handleSignOut() {
    await signOut();
  }

  function handleResetDevice() {
    setResetPending(true);
    const nextFingerprint = resetDeviceFingerprint();
    setSessionState({
      session: null,
      loading: false,
      error: '',
    });
    setDeviceFingerprint(nextFingerprint);
    window.setTimeout(() => {
      setResetPending(false);
    }, 250);
  }

  function getConnectionTone() {
    if (!sessionState.session) return 'route-status-pill';
    if (sessionState.session.status === 'revoked') {
      return 'route-status-pill route-status-pill--danger';
    }
    if (sessionState.session.can_control) {
      return 'route-status-pill route-status-pill--success';
    }
    return 'route-status-pill route-status-pill--warning';
  }

  function getConnectionLabel() {
    if (!sessionState.session) return 'Chưa đồng bộ phiên';
    if (sessionState.session.status === 'revoked') return 'Thiết bị đã bị thu hồi';
    if (sessionState.session.can_control) return 'Máy chính đang điều khiển';
    return 'Máy phụ chỉ được xem';
  }

  if (!team) {
    return (
      <RoleShell
        eyebrow="INVALID ROUTE"
        title="TEAM KHONG TON TAI"
        subtitle="Team ID nay chua ton tai trong bo du lieu hien tai."
        badge="Team"
      >
        <div className="route-info-card">
          <h2>Team ID Không Hợp Lệ</h2>
          <p>Quay về hub để chọn một team hợp lệ từ danh sách 9 phòng ban.</p>
        </div>
      </RoleShell>
    );
  }

  if (authState.user && authState.profile?.role === 'team') {
    return (
      <div className="team-live screen">
        <div className="lobby-grid" />

        <header className="hud team-live__hud">
          <div className="hud-left">
            <Link className="route-shell__back" to="/">
              Về sảnh
            </Link>
            <span className="hud-round-label">
              {phaseState.phase.current_phase === 'round1'
                ? 'VÒNG 1 — NGÂN SÁCH NHÂN SỰ'
                : `PHASE — ${String(phaseState.phase.current_phase || 'LOBBY').toUpperCase()}`}
            </span>
          </div>

          <div className="hud-center">
            <span className="hud-team">
              <span className="hud-team-icon">{team.icon}</span>
              {team.name}
            </span>
          </div>

          <div className="hud-right">
            <span className={getConnectionTone()}>{getConnectionLabel()}</span>
            <button className="btn btn-danger" type="button" onClick={handleSignOut}>
              Đăng xuất
            </button>
          </div>
        </header>

        <TeamRound1Panel
          team={team}
          phase={phaseState.phase}
          session={sessionState.session}
          deviceFingerprint={deviceFingerprint}
          profileTeamId={authState.profile?.team_id}
        />

        <details className="team-live__ops-panel">
          <summary>Thông tin kết nối</summary>
          <div className="team-live__ops-grid">
            <TeamSessionCard
              session={sessionState.session}
              loading={sessionState.loading}
              error={sessionState.error}
              onResetDevice={handleResetDevice}
              resetPending={resetPending}
            />
            <SharedPhaseCard roleLabel={`team:${team.id}`} phaseState={phaseState} />
            <RoleIdentityCard
              title="Danh Tính Team"
              user={authState.user}
              profile={authState.profile}
              roleHint={`Route hiện tại: /team/${team.id}`}
            >
              <p className="route-muted-text">Mã thiết bị: {deviceFingerprint}</p>
            </RoleIdentityCard>
          </div>
        </details>
      </div>
    );
  }

  return (
    <RoleShell
      eyebrow="ĐIỂM VÀO THEO ĐỘI"
      title={team.name.toUpperCase()}
      subtitle="Đây là route dành riêng cho từng đội. Team đăng nhập bằng alias của mình, rồi nhận quyền primary hoặc secondary theo session policy."
      badge={`${team.icon} ${team.name}`}
    >
      <div className="route-info-grid">
        <SharedPhaseCard roleLabel={`team:${team.id}`} phaseState={phaseState} />

        {!authState.user ? (
          <RoleLoginCard
            title="Đăng Nhập Team"
            description="Mỗi đội đăng nhập bằng mã team và mật khẩu. Session đầu tiên sẽ thành primary controller, session sau vào read-only."
            accentLabel={`Đang vào route đội: ${team.name}`}
            loading={authState.loading}
            error={loginError || authState.error}
            inputLabel="Mã team"
            inputPlaceholder={`Nhập \`${team.id}\``}
            defaultIdentifier={team.id}
            onSubmit={handleLogin}
          />
        ) : authState.profile?.role !== 'team' ? (
          <div className="route-info-card">
            <h2>Không Được Truy Cập</h2>
            <p>Tài khoản hiện tại không có role `team` nên không được vào team route.</p>
            <button className="btn btn-danger" type="button" onClick={handleSignOut}>
              Đăng xuất
            </button>
          </div>
        ) : (
          null
        )}

        <div className="route-info-card">
          <h2>Cầu Nối Migration</h2>
          <p>
            Bạn có thể tiếp tục tham chiếu gameplay hiện tại qua{' '}
            <Link className="route-inline-link" to={`/prototype?team=${team.id}`}>
              prototype đã preselect team
            </Link>.
          </p>
        </div>
      </div>
    </RoleShell>
  );
}
