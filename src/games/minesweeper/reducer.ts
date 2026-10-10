import { GameActionType, type GameAction } from './actions';
import { generateNewBoardBlocks, processBlockAction, processMineBlockAction, processGameState } from './logic';
import type { GameState } from './types';

// Redux's Reducer type requires accepting `undefined` state (its one-time
// internal @@redux/INIT dispatch), even though createStore is always called
// here with an explicit preloadedState, so this default is never actually
// used in practice.
const defaultState: GameState = {
  blocks: [],
  score: 0,
  isMineStruck: false,
  gameState: 'new'
};

const gameReducer = (state: GameState = defaultState, action: GameAction): GameState => {

  switch (action.type) {

    case GameActionType.CREATE_NEW_GAME:
      return {
        ...state,
        score: 0,
        isMineStruck: false,
        gameState: 'new',
        blocks: generateNewBoardBlocks()
      };

    case GameActionType.PROCESS_CLICK:
      return {
        ...state,
        blocks: [...processBlockAction(action.payload.block, state.blocks)],
        gameState: processGameState(state.blocks) ? 'success' : 'failed'
      };

    case GameActionType.PROCESS_MINE_CLICK:
      return {
        ...state,
        score: 0,
        isMineStruck: true,
        gameState: 'failed',
        blocks: [...processMineBlockAction(action.payload.block, state.blocks)]
      };

    default:
      return state;
  }
};

export default gameReducer;
