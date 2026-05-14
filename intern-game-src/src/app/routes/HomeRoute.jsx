import { Link } from 'react-router-dom';
import { TEAMS } from '../../data/teams';

export default function HomeRoute() {
  return (
    <div className="route-hub screen stripe-bg">
      <div className="route-shell__bg" />

      <section className="route-hub__hero slide-up">
        <div className="route-shell__eyebrow">EVENT HUB</div>
        <h1 className="route-shell__title glitch">HANH TRINH THUC TAP SINH</h1>
        <p className="route-shell__subtitle">
          Chon dung vai tro de vao app shell moi. Prototype cu van duoc giu lai de
          migration an toan.
        </p>
      </section>

      <section className="route-hub__grid fade-in">
        <Link className="route-card" to="/admin">
          <span className="route-card__eyebrow">Dieu phoi</span>
          <strong>Admin</strong>
          <p>Control phase, cham diem, override van hanh.</p>
        </Link>

        <Link className="route-card" to="/presenter">
          <span className="route-card__eyebrow">May chieu</span>
          <strong>Presenter</strong>
          <p>Man hinh classroom read-only cho MC va khan phong.</p>
        </Link>

        <Link className="route-card" to="/judge/judge-1">
          <span className="route-card__eyebrow">Ban giam khao</span>
          <strong>Judge Shell</strong>
          <p>Vao vai tro judge voi mot route dai dien.</p>
        </Link>

        <Link className="route-card" to="/prototype">
          <span className="route-card__eyebrow">Reference</span>
          <strong>Prototype Flow</strong>
          <p>Ban game hien tai, van dung de demo va so sanh UI.</p>
        </Link>

        <Link className="route-card" to="/prototype?control=1">
          <span className="route-card__eyebrow">Organizer</span>
          <strong>Prototype Control</strong>
          <p>Mo prototype reference kem control panel de test nhanh flow local.</p>
        </Link>
      </section>

      <section className="route-hub__teams fade-in">
        <div className="dialog-box">
          <div className="dialog-name">TEAM ENTRY POINTS</div>
          <div className="route-hub__team-list">
            {TEAMS.map((team) => (
              <Link key={team.id} className="route-team-link" to={`/team/${team.id}`}>
                <span>{team.icon}</span>
                <span>{team.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
