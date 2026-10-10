import { GameActionType, type GameAction } from './actions';
import { generateNewBoardBlocks, processBlockAction, processMineBlockAction, processGameState } from './logic';
import type { GameState } from './types';

// An empty-board placeholder: GameBoard dispatches CREATE_NEW_GAME on mount,
// which immediately generates the real board, so this is only ever visible
// for the first render before that dispatch lands.
export const initialState: GameState = {
  blocks: [],
  score: 0,
  isMineStruck: false,
  gameState: 'new'
};

const gameReducer = (state: GameState = initialState, action: GameAction): GameState => {

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
