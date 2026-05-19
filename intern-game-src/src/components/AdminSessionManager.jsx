import { TEAMS } from '../data/teams';

function getSessionTimestamp(session) {
  return (
    session?.last_seen_at ||
    session?.revoked_at ||
    session?.created_at ||
    ''
  );
}

function getPreferredSession(current, candidate) {
  if (!current) return candidate;
  if (current.status !== 'active' && candidate.status === 'active') return candidate;
  if (current.status === 'active' && candidate.status !== 'active') return current;

  return getSessionTimestamp(candidate) > getSessionTimestamp(current)
    ? candidate
    : current;
}

function buildTeamSessionRows(sessions) {
  const sessionByTeam = new Map();

  (sessions || []).forEach((session) => {
    const teamCode = session?.teams?.team_code;
    if (!teamCode) return;
    sessionByTeam.set(
      teamCode,
      getPreferredSession(sessionByTeam.get(teamCode), session)
    );
  });

  return TEAMS.map((team) => ({
    team,
    session: sessionByTeam.get(team.id) || null,
  }));
}

function getTeamLoginStatus(session) {
  if (!session) {
    return {
      label: 'Chưa đăng nhập',
      tone: 'route-status-pill',
      description: 'Chưa thấy phiên nào của đội này trong event.',
    };
  }

  if (session.status === 'active') {
    return {
      label: 'Đã vào / đang online',
      tone: 'route-status-pill route-status-pill--success',
      description: session.device_label || 'Thiết bị đang giữ quyền điều khiển',
    };
  }

  return {
    label: 'Đã vào trước đó',
    tone: 'route-status-pill route-status-pill--warning',
    description: 'Hiện không có phiên active. Có thể đội đã thoát hoặc bị thay thế.',
  };
}

export default function AdminSessionManager({
  sessions,
  loading,
  error,
  onRefresh,
  onRevoke,
  revokePendingId,
}) {
  const rows = buildTeamSessionRows(sessions);
  const loggedInCount = rows.filter((row) => Boolean(row.session)).length;
  const activeCount = rows.filter((row) => row.session?.status === 'active').length;

  return (
    <div className="route-info-card">
      <h2>Trạng Thái Đăng Nhập 9 Đội</h2>
      <p>
        Dùng khối này để kiểm tra nhanh đội nào đã vào hệ thống. Không bắt buộc đủ 9 đội mới chơi,
        nhưng bạn sẽ nhìn ngay được đội nào chưa đăng nhập.
      </p>

      <div className="route-inline-actions">
        <button className="btn btn-ghost" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới danh sách'}
        </button>
      </div>

      <div className="route-admin-stats route-admin-stats--sessions">
        <p>
          Đã từng đăng nhập: <strong>{loggedInCount}/9 đội</strong>
        </p>
        <p>
          Đang online: <strong>{activeCount}/9 đội</strong>
        </p>
      </div>

      <div className="route-session-list route-session-list--checklist">
        {rows.map(({ team, session }) => {
          const status = getTeamLoginStatus(session);

          return (
            <div className="route-session-row route-session-row--team-status" key={team.id}>
              <div>
                <strong>
                  {team.icon} {team.name}
                </strong>
                <p>
                  <span className={status.tone}>{status.label}</span>
                </p>
                <p>{status.description}</p>
              </div>

              {session?.status === 'active' ? (
                <button
                  className="btn btn-danger"
                  type="button"
                  disabled={revokePendingId === session.id}
                  onClick={() => onRevoke(session.id)}
                >
                  {revokePendingId === session.id ? 'Đang thu hồi...' : 'Thu hồi'}
                </button>
              ) : (
                <span className="route-session-checklist-note">
                  {session ? 'Không có phiên active' : 'Chưa thấy đăng nhập'}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
