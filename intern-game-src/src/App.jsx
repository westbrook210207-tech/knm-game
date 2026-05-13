import { GameProvider, useGame } from './hooks/useGameContext';
import Lobby from './screens/Lobby';
import Round1 from './screens/Round1';
import Round2 from './screens/Round2';
import Bonus from './screens/Bonus';
import Results from './screens/Results';

function GameRouter() {
  const { state } = useGame();

  switch (state.screen) {
    case 'lobby':   return <Lobby />;
    case 'round1':  return <Round1 />;
    case 'round2':  return <Round2 />;
    case 'bonus':   return <Bonus />;
    case 'results': return <Results />;
    default:        return <Lobby />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}
