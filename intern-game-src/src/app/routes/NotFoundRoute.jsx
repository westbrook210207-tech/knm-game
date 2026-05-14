import RoleShell from '../layouts/RoleShell';

export default function NotFoundRoute() {
  return (
    <RoleShell
      eyebrow="INVALID ROUTE"
      title="KHONG TIM THAY TRANG"
      subtitle="Route nay khong ton tai trong shell hien tai. Hay quay ve hub de vao dung vai tro."
      badge="404"
    >
      <div className="route-info-card">
        <h2>Fallback route</h2>
        <p>
          Phase B gio co fallback page ro rang thay vi man hinh trang khi URL bi go sai
          hoac refresh vao mot duong dan khong hop le.
        </p>
      </div>
    </RoleShell>
  );
}
