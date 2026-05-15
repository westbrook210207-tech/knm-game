export default function RoleIdentityCard({
  title,
  user,
  profile,
  roleHint,
  children,
}) {
  return (
    <div className="route-info-card">
      <h2>{title}</h2>
      <p>Email: {user?.email || 'không-rõ'}</p>
      <p>Vai trò: {profile?.role || 'chưa-có'}</p>
      <p>Tên hiển thị: {profile?.display_name || 'chưa-có'}</p>
      {roleHint ? <p>{roleHint}</p> : null}
      {children}
    </div>
  );
}
