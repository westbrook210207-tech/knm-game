export const BONUS_COLS = 9;
export const BONUS_ROWS = 12;
export const BONUS_PLAYER_ROW_START = BONUS_ROWS - 1;
export const BONUS_GOAL_ROW = 0;
export const BONUS_STARTING_LIVES = 3;
export const BONUS_WIN_SCORE = 2;

export const BONUS_LANE_CONFIG = [
  { type: 'safe', cars: [] },
  { type: 'road', cars: [{ col: 6, dir: -1, speed: 0.6 }] },
  { type: 'road', cars: [{ col: 1, dir: 1, speed: 0.8 }, { col: 7, dir: 1, speed: 0.8 }] },
  { type: 'road', cars: [{ col: 4, dir: -1, speed: 0.5 }] },
  { type: 'safe', cars: [] },
  { type: 'road', cars: [{ col: 0, dir: 1, speed: 0.9 }, { col: 5, dir: 1, speed: 0.9 }] },
  { type: 'road', cars: [{ col: 2, dir: -1, speed: 0.7 }] },
  { type: 'road', cars: [{ col: 8, dir: -1, speed: 0.6 }, { col: 3, dir: -1, speed: 0.6 }] },
  { type: 'safe', cars: [] },
  { type: 'road', cars: [{ col: 0, dir: 1, speed: 1.0 }] },
  { type: 'road', cars: [{ col: 4, dir: -1, speed: 0.8 }] },
  { type: 'safe', cars: [] },
];

export function getInitialBonusState() {
  return {
    score: 0,
    phase: 'playing',
    lives: BONUS_STARTING_LIVES,
  };
}

export function createInitialPlayerPosition() {
  return { row: BONUS_PLAYER_ROW_START, col: 4 };
}

export function initCars() {
  return BONUS_LANE_CONFIG.flatMap((lane, row) =>
    lane.cars.map((car, index) => ({
      id: `${row}-${index}`,
      row,
      col: car.col,
      dir: car.dir,
      speed: car.speed,
      t: 0,
    }))
  );
}

export function clampPlayerPosition(position) {
  return {
    row: Math.max(0, Math.min(BONUS_ROWS - 1, position.row)),
    col: Math.max(0, Math.min(BONUS_COLS - 1, position.col)),
  };
}
