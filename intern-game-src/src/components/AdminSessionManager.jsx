export default function AdminSessionManager({
  sessions,
  loading,
  error,
  onRefresh,
  onRevoke,
  revokePendingId,
}) {
  return (
    <div className="route-info-card">
      <h2>Quản Lý Phiên Team</h2>
      <p>Admin có thể xem và revoke team session nếu vào nhầm máy hoặc cần reset quyền điều khiển.</p>

      <div className="route-inline-actions">
        <button className="btn btn-ghost" type="button" onClick={onRefresh} disabled={loading}>
          {loading ? 'Đang tải...' : 'Tải lại'}
        </button>
      </div>

      {sessions.length ? (
        <div className="route-session-list">
          {sessions.map((session) => (
            <div className="route-session-row" key={session.id}>
              <div>
                <strong>
                  {session.teams?.display_name || session.teams?.team_code || 'Team không rõ'}
                </strong>
                <p>{session.device_label || 'không-rõ-thiết-bị'}</p>
                <p>
                  {session.is_primary ? 'máy-chính' : 'máy-phụ'} /{' '}
                  {session.can_control ? 'được-điều-khiển' : 'chỉ-được-xem'} / {session.status}
                </p>
              </div>

              <button
                className="btn btn-danger"
                type="button"
                disabled={session.status !== 'active' || revokePendingId === session.id}
                onClick={() => onRevoke(session.id)}
              >
                {revokePendingId === session.id ? 'Đang thu hồi...' : 'Thu hồi'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>Chưa có team session nào được tạo.</p>
      )}

      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
