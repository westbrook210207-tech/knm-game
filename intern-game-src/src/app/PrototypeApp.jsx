import { GameProvider, useGame } from '../hooks/useGameContext';
import ControlPanel from '../components/ControlPanel';
import Lobby from '../screens/Lobby';
import Round1 from '../screens/Round1';
import Round2 from '../screens/Round2';
import Bonus from '../screens/Bonus';
import Results from '../screens/Results';

function isControlPanelEnabled() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('control') === '1';
}

function GameScreenRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'lobby':
      return <Lobby />;
    case 'round1':
      return <Round1 />;
    case 'round2':
      return <Round2 />;
    case 'bonus':
      return <Bonus />;
    case 'results':
      return <Results />;
    default:
      return <Lobby />;
  }
}

export default function PrototypeApp() {
  const showControlPanel = isControlPanelEnabled();

  return (
    <GameProvider>
      <GameScreenRouter />
      {showControlPanel ? <ControlPanel /> : null}
    </GameProvider>
  );
}
