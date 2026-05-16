import { useEffect, useRef, useState } from 'react';
import './Timer.css';

export function parseCountdownEndsAt(endsAt) {
  if (!endsAt) return null;
  if (endsAt instanceof Date) return endsAt.getTime();

  const rawValue = String(endsAt).trim();
  if (!rawValue) return null;

  const hasTimezone = /(?:z|[+-]\d{2}:\d{2})$/i.test(rawValue);
  const normalizedValue = hasTimezone ? rawValue : `${rawValue}Z`;
  const parsedTime = new Date(normalizedValue).getTime();

  return Number.isNaN(parsedTime) ? null : parsedTime;
}

function getRemainingSeconds(seconds, endsAt) {
  if (endsAt) {
    const deadlineMs = parseCountdownEndsAt(endsAt);
    if (deadlineMs === null) {
      return Math.max(0, seconds || 0);
    }

    const diffMs = deadlineMs - Date.now();
    return Math.max(0, Math.ceil(diffMs / 1000));
  }

  return Math.max(0, seconds || 0);
}

export default function Timer({ seconds, endsAt = null, onExpire, paused = false }) {
  const [remaining, setRemaining] = useState(() =>
    getRemainingSeconds(seconds, endsAt)
  );
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(getRemainingSeconds(seconds, endsAt));
  }, [seconds, endsAt]);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      onExpireRef.current?.();
      return;
    }
    const t = setTimeout(() => {
      setRemaining(getRemainingSeconds(seconds, endsAt));
    }, 1000);
    return () => clearTimeout(t);
  }, [remaining, paused, seconds, endsAt]);

  const totalSeconds = Math.max(1, seconds || remaining || 1);
  const pct = (remaining / totalSeconds) * 100;
  const color = pct > 50 ? 'var(--accent-green)' : pct > 25 ? 'var(--accent-orange)' : 'var(--accent-red)';

  return (
    <div className="timer">
      <div className="timer-num" style={{ color }}>{remaining}s</div>
      <div className="timer-bar-track">
        <div
          className="timer-bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
