function getSessionTone(session) {
  if (!session) return 'route-status-pill';
  if (session.status === 'revoked') return 'route-status-pill route-status-pill--danger';
  if (session.status === 'active') return 'route-status-pill route-status-pill--success';
  return 'route-status-pill route-status-pill--warning';
}

export default function TeamSessionCard({
  session,
  loading,
  error,
  onReclaimSession,
  reclaimPending,
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
                ? 'Đã bị thay thế'
                : session.status === 'active'
                  ? 'Phiên đang điều khiển'
                  : 'Phiên không hoạt động'}
            </span>
          </p>
          <p>Thiết bị: {session.device_label || 'không-rõ-thiết-bị'}</p>
          <p>Mã phiên tab này: {session.session_token || session.device_fingerprint || 'không-rõ'}</p>
          <p>Trạng thái: {session.status}</p>
          {session.status === 'revoked' ? (
            <>
              <p className="route-error-text">
                Phiên này đã bị một lần đăng nhập mới hơn thay thế. Nếu muốn giành lại quyền điều khiển, hãy chủ động tạo phiên active mới từ tab này.
              </p>
              {onReclaimSession ? (
                <div className="route-inline-actions">
                  <button
                    className="btn btn-ghost"
                    type="button"
                    onClick={onReclaimSession}
                    disabled={reclaimPending}
                  >
                    {reclaimPending ? 'Đang giành lại quyền...' : 'Giành lại quyền điều khiển'}
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
