import { useParams } from 'react-router-dom';
import { JUDGES } from '../../data/judges';
import RoleShell from '../layouts/RoleShell';

export default function JudgeRoute() {
  const { judgeId } = useParams();
  const judge = JUDGES.find((entry) => entry.id === judgeId);

  if (!judge) {
    return (
      <RoleShell
        eyebrow="INVALID ROUTE"
        title="JUDGE KHONG TON TAI"
        subtitle="Judge ID nay chua duoc khai bao trong shell phase."
        badge="Judge"
      >
        <div className="route-info-card">
          <h2>Judge ID khong hop le</h2>
          <p>Hay dung mot trong cac route mau: `/judge/judge-1`, `/judge/judge-2`, `/judge/judge-3`.</p>
        </div>
      </RoleShell>
    );
  }

  return (
    <RoleShell
      eyebrow="ROLE SHELL"
      title={judge.name.toUpperCase()}
      subtitle="Man hinh BGK cho rubric scoring. Submit diem va sync realtime se duoc them o phase sau."
      badge="Judge"
    >
      <div className="route-info-grid">
        <div className="route-info-card">
          <h2>Judge scope</h2>
          <p>Judge hien tai: {judge.id}. Route da san sang de nhan session va scoring UI sau nay.</p>
        </div>
        <div className="route-info-card">
          <h2>Phase B boundary</h2>
          <p>Chua co login, chua co write score, chua co permission logic.</p>
        </div>
      </div>
    </RoleShell>
  );
}
