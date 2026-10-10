import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './app/App';
import { generateNewBoardBlocks } from './games/minesweeper/logic';
import gameReducer from './games/minesweeper/reducer';
import type { GameState } from './games/minesweeper/types';

const initialState: GameState = {
  blocks: generateNewBoardBlocks(),
  score: 0,
  isMineStruck: false,
  gameState: 'new'
};
const store = createStore(gameReducer, initialState);

const container = document.getElementById('app');
if (!container) {
  throw new Error('#app element not found');
}

createRoot(container).render(
  <Provider store={store}>
    <App />
  </Provider>
);
