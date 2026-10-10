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
  gameState: 'new',
  dismissedFor: null
};

const gameReducer = (state: GameState = initialState, action: GameAction): GameState => {
  switch (action.type) {
    case GameActionType.CREATE_NEW_GAME:
      return {
        ...state,
        score: 0,
        isMineStruck: false,
        gameState: 'new',
        dismissedFor: null,
        blocks: generateNewBoardBlocks()
      };

    case GameActionType.PROCESS_CLICK: {
      // A click that doesn't complete the board must leave gameState as
      // whatever it already was (i.e. 'new' / in progress) -- not force it
      // to 'failed'. processGameState(blocks) only answers "has the player
      // won", so a false result here means "keep playing", not "lost".
      const blocks = processBlockAction(action.payload.block, state.blocks);
      return {
        ...state,
        blocks: [...blocks],
        gameState: processGameState(blocks) ? 'success' : state.gameState
      };
    }

    case GameActionType.PROCESS_MINE_CLICK:
      return {
        ...state,
        score: 0,
        isMineStruck: true,
        gameState: 'failed',
        blocks: [...processMineBlockAction(action.payload.block, state.blocks)]
      };

    case GameActionType.DISMISS_RESULT:
      return {
        ...state,
        dismissedFor: state.gameState
      };

    default:
      return state;
  }
};

export default gameReducer;
