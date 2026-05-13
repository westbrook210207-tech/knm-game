import { createContext, useContext, useReducer } from 'react';

const GameContext = createContext(null);

const initialState = {
  screen: 'lobby',           // lobby | round1 | round2 | bonus | results
  sessionId: null,
  teamId: null,
  teamName: null,
  tokens: 10,                // Round 1 tokens
  round1Score: 0,
  round2Score: 0,
  bonusScore: 0,
  totalScore: 0,
  currentQuestion: 0,
  allTeams: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_SCREEN':
      return { ...state, screen: action.payload };
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload.sessionId, allTeams: action.payload.teams || [] };
    case 'SET_TEAM':
      return { ...state, teamId: action.payload.id, teamName: action.payload.name, tokens: 10 };
    case 'UPDATE_TOKENS':
      return { ...state, tokens: action.payload };
    case 'SET_ROUND1_SCORE':
      return { ...state, round1Score: action.payload };
    case 'SET_ROUND2_SCORE':
      return { ...state, round2Score: action.payload };
    case 'SET_BONUS_SCORE':
      return { ...state, bonusScore: action.payload };
    case 'NEXT_QUESTION':
      return { ...state, currentQuestion: state.currentQuestion + 1 };
    case 'RESET_QUESTION':
      return { ...state, currentQuestion: 0 };
    case 'CALC_TOTAL':
      return {
        ...state,
        totalScore: state.round1Score + state.round2Score + state.bonusScore,
      };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
