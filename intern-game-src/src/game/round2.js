import { ROUND2_SCENARIOS } from '../data/round2Scenarios';

export function getInitialRound2State() {
  return {
    score: 0,
    phase: 'reading',
    swot: { S: '', W: '', O: '', T: '' },
  };
}

export function getScenarioByTeamId(teamId) {
  return ROUND2_SCENARIOS[teamId] || ROUND2_SCENARIOS.finance;
}

export function getDefaultSwotState() {
  return { S: '', W: '', O: '', T: '' };
}
