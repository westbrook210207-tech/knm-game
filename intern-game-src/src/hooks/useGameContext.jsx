import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { getInitialRound1State } from '../game/round1';
import { getInitialRound2State } from '../game/round2';
import { calculateTotalScore } from '../game/scoring';
import {
  clearPersistedSession,
  loadPersistedSession,
  persistSession,
} from '../game/sessionPersistence';

const GameContext = createContext(null);

const baseState = {
  screen: 'lobby',
  sessionId: null,
  allTeams: [],
  team: {
    id: null,
    name: null,
  },
  round1: getInitialRound1State(),
  round2: getInitialRound2State(),
  results: {
    totalScore: 0,
  },
};

function computeTotalScore(state) {
  return calculateTotalScore(state.round1.score, state.round2.score);
}

function createState(overrides = {}) {
  const nextState = {
    ...baseState,
    ...overrides,
    team: { ...baseState.team, ...(overrides.team || {}) },
    round1: { ...getInitialRound1State(), ...(overrides.round1 || {}) },
    round2: { ...getInitialRound2State(), ...(overrides.round2 || {}) },
    results: {
      ...baseState.results,
      ...(overrides.results || {}),
    },
  };

  nextState.results.totalScore = computeTotalScore(nextState);
  return nextState;
}

const initialState = createState(loadPersistedSession() || {});

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_SESSION':
      return {
        ...state,
        sessionId: action.payload.sessionId,
        allTeams: action.payload.teams || [],
      };
    case 'SET_TEAM':
      return {
        ...state,
        team: { id: action.payload.id, name: action.payload.name },
        round1: { ...state.round1, tokens: 10, currentQuestion: 0, score: 0 },
        round2: getInitialRound2State(),
        results: { totalScore: 0 },
      };
    case 'UPDATE_TOKENS':
      return {
        ...state,
        round1: { ...state.round1, tokens: action.payload },
      };
    case 'SET_ROUND1_SCORE':
      return createState({
        ...state,
        round1: { ...state.round1, score: action.payload },
      });
    case 'SET_ROUND2_SCORE':
      return createState({
        ...state,
        round2: { ...state.round2, score: action.payload },
      });
    case 'NEXT_QUESTION':
      return {
        ...state,
        round1: {
          ...state.round1,
          currentQuestion: state.round1.currentQuestion + 1,
        },
      };
    case 'RESET_QUESTION':
      return {
        ...state,
        round1: { ...state.round1, currentQuestion: 0 },
      };
    case 'SET_ROUND1_QUESTION':
      return {
        ...state,
        round1: { ...state.round1, currentQuestion: action.payload },
      };
    case 'RESET_GAME':
      clearPersistedSession();
      return createState();
    case 'CALC_TOTAL':
      return createState(state);
    default:
      return state;
  }
}

function addLegacyAliases(state) {
  return {
    ...state,
    teamId: state.team.id,
    teamName: state.team.name,
    tokens: state.round1.tokens,
    round1Score: state.round1.score,
    round2Score: state.round2.score,
    totalScore: state.results.totalScore,
    currentQuestion: state.round1.currentQuestion,
  };
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    persistSession(state);
  }, [state]);

  const value = useMemo(
    () => ({
      state: addLegacyAliases(state),
      dispatch,
    }),
    [state]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
