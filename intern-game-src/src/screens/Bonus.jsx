import { useState, useEffect, useCallback, useRef } from 'react';
import { useGame } from '../hooks/useGameContext';
import { submitBonusResult } from '../api';
import HUD from '../components/HUD';
import './Bonus.css';

const COLS = 9;
const ROWS = 12;
const PLAYER_ROW_START = ROWS - 1;
const GOAL_ROW = 0;

// Lane config: each row has cars going left or right at varying speeds
const LANE_CONFIG = [
  { type: 'safe',  cars: [] },                         // row 0 = goal
  { type: 'road',  cars: [{ col: 6, dir: -1, speed: 0.6 }] },
  { type: 'road',  cars: [{ col: 1, dir: 1,  speed: 0.8 }, { col: 7, dir: 1, speed: 0.8 }] },
  { type: 'road',  cars: [{ col: 4, dir: -1, speed: 0.5 }] },
  { type: 'safe',  cars: [] },                         // row 4 = median
  { type: 'road',  cars: [{ col: 0, dir: 1,  speed: 0.9 }, { col: 5, dir: 1, speed: 0.9 }] },
  { type: 'road',  cars: [{ col: 2, dir: -1, speed: 0.7 }] },
  { type: 'road',  cars: [{ col: 8, dir: -1, speed: 0.6 }, { col: 3, dir: -1, speed: 0.6 }] },
  { type: 'safe',  cars: [] },                         // row 8 = sidewalk
  { type: 'road',  cars: [{ col: 0, dir: 1,  speed: 1.0 }] },
  { type: 'road',  cars: [{ col: 4, dir: -1, speed: 0.8 }] },
  { type: 'safe',  cars: [] },                         // row 11 = start
];

function initCars() {
  return LANE_CONFIG.flatMap((lane, row) =>
    lane.cars.map((c, i) => ({
      id: `${row}-${i}`,
      row,
      col: c.col,
      dir: c.dir,
      speed: c.speed,
      t: 0,
    }))
  );
}

export default function Bonus() {
  const { state, dispatch } = useGame();
  const { sessionId, teamId } = state;

  const [playerPos, setPlayerPos] = useState({ row: PLAYER_ROW_START, col: 4 });
  const [cars, setCars] = useState(initCars);
  const [phase, setPhase] = useState('playing'); // playing | dead | won
  const [lives, setLives] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const animRef = useRef(null);
  const lastRef = useRef(null);
  const playerRef = useRef({ row: PLAYER_ROW_START, col: 4 });
  const phaseRef = useRef('playing');

  // Update phase ref
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Keyboard controls
  const handleKey = useCallback((e) => {
    if (phaseRef.current !== 'playing') return;
    const moves = {
      ArrowUp:    { row: -1, col: 0 },
      ArrowDown:  { row: 1,  col: 0 },
      ArrowLeft:  { row: 0,  col: -1 },
      ArrowRight: { row: 0,  col: 1 },
      w: { row: -1, col: 0 },
      s: { row: 1,  col: 0 },
      a: { row: 0,  col: -1 },
      d: { row: 0,  col: 1 },
    };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setPlayerPos((p) => {
      const nr = Math.max(0, Math.min(ROWS - 1, p.row + m.row));
      const nc = Math.max(0, Math.min(COLS - 1, p.col + m.col));
      playerRef.current = { row: nr, col: nc };
      return { row: nr, col: nc };
    });
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const tick = (now) => {
      if (!lastRef.current) lastRef.current = now;
      const dt = Math.min((now - lastRef.current) / 1000, 0.1);
      lastRef.current = now;

      setCars((prev) =>
        prev.map((car) => {
          let nt = car.t + car.speed * dt;
          let nc = car.col + car.dir * car.speed * dt;
          if (nc < -1) nc = COLS + 0.5;
          if (nc > COLS + 0.5) nc = -1;
          return { ...car, col: nc, t: nt };
        })
      );

      // Collision check
      const p = playerRef.current;
      setCars((carsNow) => {
        const hit = carsNow.some((car) => {
          if (car.row !== p.row) return false;
          return Math.abs(Math.round(car.col) - p.col) < 1;
        });
        if (hit) {
          setLives((l) => {
            const nl = l - 1;
            if (nl <= 0) {
              phaseRef.current = 'dead';
              setPhase('dead');
            } else {
              // Respawn
              const startPos = { row: PLAYER_ROW_START, col: 4 };
              setPlayerPos(startPos);
              playerRef.current = startPos;
            }
            return nl;
          });
        }
        return carsNow;
      });

      // Win check
      if (p.row === GOAL_ROW) {
        phaseRef.current = 'won';
        setPhase('won');
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [phase]);

  const handleFinish = async (won) => {
    if (submitted) return;
    setSubmitted(true);
    const bonus = won ? 2 : 0;
    dispatch({ type: 'SET_BONUS_SCORE', payload: bonus });
    dispatch({ type: 'CALC_TOTAL' });
    try {
      await submitBonusResult(sessionId, { teamId, completed: won });
    } catch {}
    dispatch({ type: 'SET_SCREEN', payload: 'results' });
  };

  const moveBtn = (dr, dc) => {
    if (phaseRef.current !== 'playing') return;
    setPlayerPos((p) => {
      const nr = Math.max(0, Math.min(ROWS - 1, p.row + dr));
      const nc = Math.max(0, Math.min(COLS - 1, p.col + dc));
      playerRef.current = { row: nr, col: nc };
      return { row: nr, col: nc };
    });
  };

  const cellSize = 48;

  return (
    <div className="bonus screen">
      <HUD />

      <div className="bonus-main">
        {/* Boss dialog */}
        <div className="bonus-boss-row">
          <span className="boss-avatar-sm">👔</span>
          <div className="dialog-box bonus-dialog">
            <div className="dialog-name">SẾP TỔNG</div>
            <div className="dialog-text">
              {phase === 'playing' && 'Vượt qua con đường hỗn loạn để về nhà an toàn! Đội nào về đến đích nhận +2 điểm!'}
              {phase === 'won' && '🎉 XUẤT SẮC! Bạn đã về đến nhà an toàn! +2 điểm bonus!'}
              {phase === 'dead' && '💀 Không còn mạng! Trò chơi kết thúc. Tiếp tục vòng tổng kết...'}
            </div>
          </div>
          <div className="bonus-lives">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ opacity: i < lives ? 1 : 0.2, fontSize: '1.4rem' }}>❤️</span>
            ))}
          </div>
        </div>

        {/* Game area */}
        <div className="bonus-game-wrap">
          <div
            className="bonus-grid"
            style={{ width: COLS * cellSize, height: ROWS * cellSize, position: 'relative' }}
          >
            {/* Lane backgrounds */}
            {LANE_CONFIG.map((lane, row) => (
              <div
                key={row}
                className={`bonus-lane ${lane.type}`}
                style={{ top: row * cellSize, height: cellSize, width: '100%', position: 'absolute' }}
              />
            ))}

            {/* Goal row label */}
            <div className="bonus-goal-label" style={{ top: 0, height: cellSize, width: '100%', position: 'absolute' }}>
              🏠 ĐÍCH
            </div>

            {/* Cars */}
            {cars.map((car) => (
              <div
                key={car.id}
                className="bonus-car"
                style={{
                  position: 'absolute',
                  top: car.row * cellSize + 4,
                  left: car.col * cellSize + 2,
                  width: cellSize - 4,
                  height: cellSize - 8,
                  transform: car.dir === -1 ? 'scaleX(-1)' : 'none',
                }}
              >
                🚗
              </div>
            ))}

            {/* Player */}
            {phase !== 'dead' && (
              <div
                className="bonus-player"
                style={{
                  position: 'absolute',
                  top: playerPos.row * cellSize + 2,
                  left: playerPos.col * cellSize + 2,
                  width: cellSize - 4,
                  height: cellSize - 4,
                  transition: 'top 0.1s, left 0.1s',
                }}
              >
                🧑‍💼
              </div>
            )}
          </div>
        </div>

        {/* Mobile D-Pad */}
        <div className="bonus-dpad">
          <div className="dpad-row">
            <button className="dpad-btn" onClick={() => moveBtn(-1, 0)}>▲</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onClick={() => moveBtn(0, -1)}>◄</button>
            <button className="dpad-btn dpad-center" disabled>⬤</button>
            <button className="dpad-btn" onClick={() => moveBtn(0, 1)}>►</button>
          </div>
          <div className="dpad-row">
            <button className="dpad-btn" onClick={() => moveBtn(1, 0)}>▼</button>
          </div>
        </div>

        {/* End buttons */}
        {(phase === 'won' || phase === 'dead') && (
          <button
            className="btn btn-primary bonus-next-btn slide-up"
            onClick={() => handleFinish(phase === 'won')}
          >
            {phase === 'won' ? '🏆 Nhận +2 điểm & xem kết quả →' : '📊 Xem kết quả tổng kết →'}
          </button>
        )}

        <p className="bonus-hint">Dùng phím ↑↓←→ hoặc WASD để di chuyển</p>
      </div>
    </div>
  );
}
