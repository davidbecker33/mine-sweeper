import type { Cell } from './types';

export const GameActionType = {
  NEW_GAME: 'NEW_GAME',
  CREATE_NEW_GAME: 'CREATE_NEW_GAME',
  PROCESS_CLICK: 'PROCESS_CLICK',
  PROCESS_MINE_CLICK: 'PROCESS_MINE_CLICK',
  DISMISS_RESULT: 'DISMISS_RESULT'
} as const;

export const gameActions = {
  createNewGame: (level?: string) => ({
    type: GameActionType.CREATE_NEW_GAME,
    payload: { level }
  }),

  processClick: (block: Cell) => ({
    type: GameActionType.PROCESS_CLICK,
    payload: { block }
  }),

  processMineClick: (block: Cell) => ({
    type: GameActionType.PROCESS_MINE_CLICK,
    payload: { block }
  }),

  dismissResult: () => ({
    type: GameActionType.DISMISS_RESULT
  })
};

export type GameAction =
  | ReturnType<typeof gameActions.createNewGame>
  | ReturnType<typeof gameActions.processClick>
  | ReturnType<typeof gameActions.processMineClick>
  | ReturnType<typeof gameActions.dismissResult>;
