export const TOKEN_CONVERSION = [
  { min: 18, max: Infinity, points: 5 },
  { min: 14, max: 17, points: 4 },
  { min: 9, max: 13, points: 3 },
  { min: 4, max: 8, points: 2 },
  { min: 0, max: 3, points: 1 },
];

export function tokensToPoints(tokens) {
  return TOKEN_CONVERSION.find((range) => tokens >= range.min && tokens <= range.max)?.points ?? 0;
}

export function calculateTotalScore(round1Score, round2Score, bonusScore) {
  return round1Score + round2Score + bonusScore;
}
