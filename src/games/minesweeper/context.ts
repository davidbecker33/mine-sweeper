import { createGameContext } from '../../engine/create-game-context';
import gameReducer, { initialState } from './reducer';
import type { GameAction } from './actions';
import type { GameState } from './types';

export const { GameContext, GameProvider, useGame } = createGameContext<GameState, GameAction>(
  gameReducer,
  initialState
);
