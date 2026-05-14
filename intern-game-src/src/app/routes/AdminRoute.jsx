import RoleShell from '../layouts/RoleShell';

export default function AdminRoute() {
  return (
    <RoleShell
      eyebrow="ROLE SHELL"
      title="ADMIN"
      subtitle="Phase B shell cho role dieu phoi su kien. Realtime, auth, va control logic se duoc them o phase sau."
      badge="Admin"
    >
      <div className="route-info-grid">
        <div className="route-info-card">
          <h2>Trach nhiem sau nay</h2>
          <p>Dieu khien phase, mark dap an Round 1, quan ly pitch flow, va override khi event bi ket.</p>
        </div>
        <div className="route-info-card">
          <h2>Trang thai hien tai</h2>
          <p>Day la shell page de khoa route structure. Chua co auth, chua co Supabase, chua co write logic.</p>
        </div>
      </div>
    </RoleShell>
  );
}
