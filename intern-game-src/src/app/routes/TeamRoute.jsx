import { Link, useParams } from 'react-router-dom';
import { TEAMS } from '../../data/teams';
import RoleShell from '../layouts/RoleShell';

export default function TeamRoute() {
  const { teamId } = useParams();
  const team = TEAMS.find((entry) => entry.id === teamId);

  if (!team) {
    return (
      <RoleShell
        eyebrow="INVALID ROUTE"
        title="TEAM KHONG TON TAI"
        subtitle="Team ID nay chua ton tai trong bo du lieu hien tai."
        badge="Team"
      >
        <div className="route-info-card">
          <h2>Team ID khong hop le</h2>
          <p>Quay ve hub de chon mot team hop le tu danh sach 9 phong ban.</p>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell
      eyebrow="TEAM SHELL"
      title={team.name.toUpperCase()}
      subtitle="Day la team entry point moi. Prototype flow cu van duoc giu o route rieng trong luc migration."
      badge={`${team.icon} ${team.name}`}
    >
      <div className="route-info-grid">
        <div className="route-info-card">
          <h2>Team-scoped route</h2>
          <p>Route nay da nhan `teamId` tu URL va san sang de gan login, session policy, va phase sync o buoc tiep theo.</p>
        </div>
        <div className="route-info-card">
          <h2>Migration bridge</h2>
          <p>
            Ban co the tiep tuc tham chieu gameplay hien tai qua{' '}
            <Link className="route-inline-link" to={`/prototype?team=${team.id}`}>
              prototype da preselect team
            </Link>.
          </p>
        </div>
      </div>
    </RoleShell>
  );
}
