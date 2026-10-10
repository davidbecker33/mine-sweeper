import { createRoot } from 'react-dom/client';
import App from './app/App';
import { GameProvider } from './games/minesweeper/context';
import './styles/globals.css';

const container = document.getElementById('app');
if (!container) {
  throw new Error('#app element not found');
}

createRoot(container).render(
  <GameProvider>
    <App />
  </GameProvider>
);
