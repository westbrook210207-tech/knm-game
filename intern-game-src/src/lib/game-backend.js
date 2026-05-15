import { getSharedGameState } from './supabase/gameState';
import {
  getTeamRound1Bet,
  getTeamScore,
  listRound1Bets,
  listTeamScores,
} from './supabase/round1';

export const LIVE_REFRESH_INTERVAL_MS = 5000;

export async function getSharedPhaseSnapshot() {
  return getSharedGameState();
}

export async function getPresenterSnapshot() {
  const [phase, leaderboard] = await Promise.all([
    getSharedPhaseSnapshot(),
    listTeamScores(),
  ]);

  return {
    phase,
    leaderboard,
  };
}

export async function getAdminRound1Snapshot(questionIndex) {
  const [phase, leaderboard, bets] = await Promise.all([
    getSharedPhaseSnapshot(),
    listTeamScores(),
    typeof questionIndex === 'number' ? listRound1Bets(questionIndex) : listRound1Bets(),
  ]);

  return {
    phase,
    leaderboard,
    bets,
  };
}

export async function getTeamRound1Snapshot({ teamProfileId, questionIndex }) {
  const [phase, score, bet] = await Promise.all([
    getSharedPhaseSnapshot(),
    teamProfileId ? getTeamScore(teamProfileId) : Promise.resolve(null),
    teamProfileId && typeof questionIndex === 'number'
      ? getTeamRound1Bet(teamProfileId, questionIndex)
      : Promise.resolve(null),
  ]);

  return {
    phase,
    score,
    bet,
  };
}
