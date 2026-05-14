import { useEffect, useRef, useState } from 'react';
import './Timer.css';

export default function Timer({ seconds, onExpire, paused = false }) {
  const [remaining, setRemaining] = useState(seconds);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (paused) return;
    if (remaining <= 0) {
      onExpireRef.current?.();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, paused]);

  const pct = (remaining / seconds) * 100;
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
