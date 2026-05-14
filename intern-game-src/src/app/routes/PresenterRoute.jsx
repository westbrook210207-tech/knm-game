import RoleShell from '../layouts/RoleShell';

export default function PresenterRoute() {
  return (
    <RoleShell
      eyebrow="ROLE SHELL"
      title="PRESENTER"
      subtitle="Man hinh may chieu cho classroom mode. Phase sau se doc shared game state va leaderboard realtime."
      badge="Presenter"
    >
      <div className="route-info-grid">
        <div className="route-info-card">
          <h2>Presenter mode</h2>
          <p>Se hien countdown, dap an, active team, va podium cuoi game sau khi co backend state.</p>
        </div>
        <div className="route-info-card">
          <h2>Luc nay</h2>
          <p>UI shell giu dung visual language cua prototype de migration khong mat chat game feel.</p>
        </div>
      </div>
    </RoleShell>
  );
}
