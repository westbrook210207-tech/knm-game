import { Link } from 'react-router-dom';

export default function RoleShell({
  eyebrow,
  title,
  subtitle,
  badge,
  children,
}) {
  return (
    <div className="route-shell screen stripe-bg">
      <div className="route-shell__bg" />
      <header className="route-shell__header">
        <Link className="route-shell__back" to="/">
          Quay ve hub
        </Link>
        {badge ? <div className="token-badge">{badge}</div> : null}
      </header>

      <main className="route-shell__content">
        <section className="route-shell__hero slide-up">
          <div className="route-shell__eyebrow">{eyebrow}</div>
          <h1 className="route-shell__title glitch">{title}</h1>
          <p className="route-shell__subtitle">{subtitle}</p>
        </section>

        <section className="route-shell__panel dialog-box fade-in">{children}</section>
      </main>
    </div>
  );
}
