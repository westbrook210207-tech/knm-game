function getSessionTone(session) {
  if (!session) return 'route-status-pill';
  if (session.status === 'revoked') return 'route-status-pill route-status-pill--danger';
  if (session.can_control) return 'route-status-pill route-status-pill--success';
  return 'route-status-pill route-status-pill--warning';
}

export default function TeamSessionCard({
  session,
  loading,
  error,
  onResetDevice,
  resetPending,
}) {
  return (
    <div className="route-info-card">
      <h2>Phiên Team</h2>
      {loading ? <p>Đang đồng bộ phiên thiết bị...</p> : null}

      {session ? (
        <>
          <p>
            <span className={getSessionTone(session)}>
              {session.status === 'revoked'
                ? 'Đã thu hồi'
                : session.can_control
                  ? 'Máy chính được điều khiển'
                  : 'Máy phụ chỉ được xem'}
            </span>
          </p>
          <p>Thiết bị: {session.device_label || 'không-rõ-thiết-bị'}</p>
          <p>Máy chính: {session.is_primary ? 'có' : 'không'}</p>
          <p>Có quyền điều khiển: {session.can_control ? 'có' : 'không'}</p>
          <p>Trạng thái: {session.status}</p>
          {session.status === 'revoked' ? (
            <>
              <p className="route-error-text">
                Thiết bị này đã bị thu hồi quyền. Hãy tạo mã thiết bị mới hoặc nhờ admin revoke phiên đang active để claim lại quyền điều khiển.
              </p>
              {onResetDevice ? (
                <div className="route-inline-actions">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={onResetDevice}
                    disabled={resetPending}
                  >
                    {resetPending ? 'Đang tạo mã mới...' : 'Tạo mã thiết bị mới'}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : (
        <p>Chưa có session row cho thiết bị này.</p>
      )}

      {error ? <p className="route-error-text">{error}</p> : null}
    </div>
  );
}
