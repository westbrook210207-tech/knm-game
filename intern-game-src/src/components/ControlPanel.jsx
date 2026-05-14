import { useState } from 'react';
import { TEAMS } from '../data/teams';
import { useGame } from '../hooks/useGameContext';
import './ControlPanel.css';

const SCREENS = ['lobby', 'round1', 'round2', 'bonus', 'results'];

export default function ControlPanel() {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);

  const setScreen = (screen) => {
    dispatch({ type: 'SET_SCREEN', payload: screen });
  };

  const setTeam = (teamId) => {
    const team = TEAMS.find((item) => item.id === teamId);
    if (!team) return;
    dispatch({ type: 'SET_TEAM', payload: team });
  };

  return (
    <div className={`control-panel ${open ? 'open' : 'closed'}`}>
      <button
        className="control-toggle"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? 'Hide Controls' : 'Show Controls'}
      </button>

      {open && (
        <div className="control-body">
          <div className="control-section">
            <div className="control-label">Screen</div>
            <div className="control-chip-row">
              {SCREENS.map((screen) => (
                <button
                  key={screen}
                  type="button"
                  className={`control-chip ${state.screen === screen ? 'active' : ''}`}
                  onClick={() => setScreen(screen)}
                >
                  {screen}
                </button>
              ))}
            </div>
          </div>

          <div className="control-section">
            <label className="control-label" htmlFor="control-team">
              Team
            </label>
            <select
              id="control-team"
              className="control-select"
              value={state.team.id || ''}
              onChange={(event) => setTeam(event.target.value)}
            >
              <option value="">Choose team</option>
              {TEAMS.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-section">
            <div className="control-label">Round 1</div>
            <div className="control-stat">
              <span>Question</span>
              <div className="control-inline-actions">
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND1_QUESTION', payload: Math.max(0, state.round1.currentQuestion - 1) })}>-</button>
                <span>{state.round1.currentQuestion + 1}</span>
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND1_QUESTION', payload: Math.min(4, state.round1.currentQuestion + 1) })}>+</button>
              </div>
            </div>
            <div className="control-stat">
              <span>Tokens</span>
              <div className="control-inline-actions">
                <button type="button" onClick={() => dispatch({ type: 'UPDATE_TOKENS', payload: Math.max(0, state.round1.tokens - 1) })}>-</button>
                <span>{state.round1.tokens}</span>
                <button type="button" onClick={() => dispatch({ type: 'UPDATE_TOKENS', payload: Math.min(20, state.round1.tokens + 1) })}>+</button>
              </div>
            </div>
            <div className="control-stat">
              <span>Score</span>
              <div className="control-inline-actions">
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND1_SCORE', payload: Math.max(0, state.round1.score - 1) })}>-</button>
                <span>{state.round1.score}</span>
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND1_SCORE', payload: Math.min(5, state.round1.score + 1) })}>+</button>
              </div>
            </div>
          </div>

          <div className="control-section">
            <div className="control-label">Round 2 / Bonus</div>
            <div className="control-stat">
              <span>Round 2 Score</span>
              <div className="control-inline-actions">
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND2_SCORE', payload: Math.max(0, state.round2.score - 1) })}>-</button>
                <span>{state.round2.score}</span>
                <button type="button" onClick={() => dispatch({ type: 'SET_ROUND2_SCORE', payload: Math.min(5, state.round2.score + 1) })}>+</button>
              </div>
            </div>
            <div className="control-stat">
              <span>Bonus Score</span>
              <div className="control-inline-actions">
                <button type="button" onClick={() => dispatch({ type: 'SET_BONUS_SCORE', payload: 0 })}>0</button>
                <span>{state.bonus.score}</span>
                <button type="button" onClick={() => dispatch({ type: 'SET_BONUS_SCORE', payload: 2 })}>2</button>
              </div>
            </div>
          </div>

          <div className="control-actions">
            <button type="button" className="control-reset" onClick={() => dispatch({ type: 'RESET_GAME' })}>
              Reset Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
