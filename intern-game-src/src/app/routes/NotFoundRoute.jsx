import RoleShell from '../layouts/RoleShell';

export default function NotFoundRoute() {
  return (
    <RoleShell
      eyebrow="ROUTE KHÔNG HỢP LỆ"
      title="KHÔNG TÌM THẤY TRANG"
      subtitle="Route này không tồn tại trong shell hiện tại. Hãy quay về hub để vào đúng vai trò."
      badge="404"
    >
      <div className="route-info-card">
        <h2>Trang Dự Phòng</h2>
        <p>
          Phase 004 hiện có fallback page rõ ràng thay vì màn hình trắng khi URL bị gõ sai
          hoặc refresh vào một đường dẫn không hợp lệ.
        </p>
      </div>
    </RoleShell>
  );
}
