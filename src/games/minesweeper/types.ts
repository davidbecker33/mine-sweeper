import type { Board, Position } from '../../engine/types';

export interface Cell extends Position {
  key: number;
  isMine: boolean;
  visited: boolean;
  count: number;
}

export type MinesweeperBoard = Board<Cell>;

// Matches the reducer's actual output today ('new' | 'success' | 'failed').
// There's no distinct "in progress" status yet -- see the Phase 5 note on
// the PROCESS_CLICK reducer bug in docs/modernization-plan.md, which is
// where that gets introduced alongside the fix.
export type GameStatus = 'new' | 'success' | 'failed';

export interface GameState {
  blocks: MinesweeperBoard;
  score: number;
  isMineStruck: boolean;
  gameState: GameStatus;
}
