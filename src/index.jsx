import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import App from './components/app';
import { generateNewBoardBlocks } from './components/util/board-utils';
import gameReducer from './components/reducer/reducer';

const blocks = generateNewBoardBlocks();

const initialState = {
  blocks: blocks,
  score: 0,
  isMineStruck: false,
  gameState: 'new'
};
const store = createStore(gameReducer, initialState);

createRoot(document.getElementById('app')).render(
  <Provider store={store}>
    <App />
  </Provider>
);
