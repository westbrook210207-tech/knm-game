import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { TEAMS } from '../../data/teams';
import '../../screens/Round1.css';
import RoleShell from '../layouts/RoleShell';
import RoleLoginCard from '../../components/RoleLoginCard';
import SharedPhaseCard from '../../components/SharedPhaseCard';
import TeamSessionCard from '../../components/TeamSessionCard';
import TeamRound1Panel from '../../components/TeamRound1Panel';
import TeamRound2Panel from '../../components/TeamRound2Panel';
import TeamResultsPanel from '../../components/TeamResultsPanel';
import { useSupabasePhase } from '../../hooks/useSupabasePhase';
import { getDeviceLabel } from '../../lib/supabase/device';
import {
  getSnapshotRefreshInterval,
  getTeamLiveSnapshot,
} from '../../lib/game-backend';
import {
  joinTeamSession,
  leaveTeamSession,
} from '../../lib/supabase/sessions';
import {
  clearStoredTeamSession,
  createTeamSessionToken,
  isInvalidTeamSessionError,
  readStoredTeamSession,
  storeTeamSession,
} from '../../lib/teamSession';

function getStoredSessionTokenForTeam(teamId) {
  const stored = readStoredTeamSession();
  if (stored.teamCode !== teamId) {
    return '';
  }

  return stored.sessionToken || '';
}

export default function TeamRoute() {
  const { teamId } = useParams();
  const team = TEAMS.find((entry) => entry.id === teamId);
  const phaseState = useSupabasePhase();
  const [loginError, setLoginError] = useState('');
  const [sessionState, setSessionState] = useState({
    session: null,
    loading: false,
    error: '',
  });
  const [sessionToken, setSessionToken] = useState(() => getStoredSessionTokenForTeam(teamId));

  const deviceLabel = useMemo(() => getDeviceLabel(), []);
  const sessionPollIntervalMs = getSnapshotRefreshInterval(phaseState.phase);

  useEffect(() => {
    setSessionToken(getStoredSessionTokenForTeam(teamId));
    setSessionState({
      session: null,
      loading: false,
      error: '',
    });
    setLoginError('');
  }, [teamId]);

  useEffect(() => {
    if (!team || !sessionToken) return undefined;

    let alive = true;
    let intervalId = null;

    async function syncCurrentSession() {
      try {
        if (alive) {
          setSessionState((current) => ({
            ...current,
            loading: true,
            error: '',
          }));
        }

        const snapshot = await getTeamLiveSnapshot({
          teamCode: teamId,
          sessionToken,
        });

        if (!alive) return;

        setSessionState({
          session: snapshot?.session || null,
          loading: false,
          error:
            snapshot?.session?.status === 'revoked'
              ? 'Phiên của tab này đã bị một lần đăng nhập mới hơn thay thế.'
              : '',
        });
        setLoginError('');
      } catch (error) {
        if (!alive) return;

        if (isInvalidTeamSessionError(error)) {
          clearStoredTeamSession();
          setSessionToken('');
          setSessionState({
            session: null,
            loading: false,
            error:
              'Phiên đăng nhập của đội đã được mở ở thiết bị khác. Vui lòng nhập lại mật khẩu để tiếp tục.',
          });
          return;
        }

        setSessionState({
          session: null,
          loading: false,
          error: error?.message || 'Không đồng bộ được team session.',
        });
      }
    }

    void syncCurrentSession();
    intervalId = window.setInterval(() => {
      void syncCurrentSession();
    }, sessionPollIntervalMs);

    return () => {
      alive = false;
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [sessionPollIntervalMs, sessionToken, team, teamId]);

  async function handleLogin({ password }) {
    if (!team) return;

    try {
      setLoginError('');

      if (!password) {
        setLoginError('Hãy nhập mật khẩu của phòng ban.');
        return;
      }

      const nextSessionToken = createTeamSessionToken();
      await joinTeamSession({
        teamCode: team.id,
        password,
        sessionToken: nextSessionToken,
        deviceLabel,
      });
      storeTeamSession({
        teamCode: team.id,
        sessionToken: nextSessionToken,
      });
      setSessionToken(nextSessionToken);
      setSessionState({
        session: null,
        loading: true,
        error: '',
      });
    } catch (error) {
      setLoginError(error?.message || 'Đăng nhập team thất bại.');
    }
  }

  async function handleSignOut() {
    try {
      if (sessionToken) {
        await leaveTeamSession(sessionToken);
      }
    } catch (error) {
      if (!isInvalidTeamSessionError(error)) {
        setSessionState((current) => ({
          ...current,
          error: error?.message || 'Không thể đóng phiên team lúc này.',
        }));
      }
    } finally {
      clearStoredTeamSession();
      setSessionToken('');
      setSessionState({
        session: null,
        loading: false,
        error: '',
      });
      setLoginError('');
    }
  }

  function getConnectionTone() {
    if (!sessionState.session) return 'route-status-pill';
    if (sessionState.session.status === 'revoked') {
      return 'route-status-pill route-status-pill--danger';
    }
    if (sessionState.session.status === 'active') {
      return 'route-status-pill route-status-pill--success';
    }
    return 'route-status-pill route-status-pill--warning';
  }

  function getConnectionLabel() {
    if (!sessionState.session) return 'Chưa đồng bộ phiên';
    if (sessionState.session.status === 'revoked') return 'Phiên này đã bị thay thế';
    if (sessionState.session.status === 'active') return 'Phiên đang điều khiển';
    return 'Phiên không hoạt động';
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

  if (sessionToken && sessionState.session?.status === 'active') {
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
                : phaseState.phase.current_phase === 'round2'
                  ? 'VÒNG 2 — HỌP KHẨN VỚI SẾP'
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

        {phaseState.phase.current_phase === 'results' ? (
          <TeamResultsPanel
            team={team}
            phase={phaseState.phase}
            sessionToken={sessionToken}
          />
        ) : phaseState.phase.current_phase === 'round2' ? (
          <TeamRound2Panel
            team={team}
            phase={phaseState.phase}
            session={sessionState.session}
            sessionToken={sessionToken}
          />
        ) : (
          <TeamRound1Panel
            team={team}
            phase={phaseState.phase}
            session={sessionState.session}
            sessionToken={sessionToken}
          />
        )}

        <details className="team-live__ops-panel">
          <summary>Thông tin kết nối</summary>
          <div className="team-live__ops-grid">
            <TeamSessionCard
              session={sessionState.session}
              loading={sessionState.loading}
              error={sessionState.error}
            />
            <SharedPhaseCard roleLabel={`team:${team.id}`} phaseState={phaseState} />
            <div className="route-info-card">
              <h2>Danh Tính Team</h2>
              <p>Route hiện tại: /team/{team.id}</p>
              <p className="route-muted-text">
                Mã phiên tab: {sessionState.session?.session_token || sessionToken}
              </p>
            </div>
          </div>
        </details>
      </div>
    );
  }

  return (
    <RoleShell
      eyebrow="ĐIỂM VÀO THEO ĐỘI"
      title={team.name.toUpperCase()}
      subtitle="Đây là route dành riêng cho từng đội. Mỗi lần đăng nhập thành công sẽ thay thế phiên active cũ của đội đó."
      badge={`${team.icon} ${team.name}`}
    >
      <div className="route-info-grid">
        <SharedPhaseCard roleLabel={`team:${team.id}`} phaseState={phaseState} />

        <RoleLoginCard
          title="Đăng Nhập Team"
          description="Mỗi đội chỉ có một phiên active tại một thời điểm. Nếu cùng một đội đăng nhập ở tab hoặc thiết bị khác, phiên cũ sẽ tự bị thay thế."
          accentLabel={`Đang vào route đội: ${team.name}`}
          loading={sessionState.loading}
          error={loginError || sessionState.error}
          inputLabel="Mã team"
          inputPlaceholder={`Nhập \`${team.id}\``}
          defaultIdentifier={team.id}
          onSubmit={handleLogin}
        />

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
