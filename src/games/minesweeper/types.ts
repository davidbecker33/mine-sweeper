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
  // Which gameState value the result modal has been dismissed for, if any.
  // Lets "should the modal be showing" be a pure derived value
  // (isMineStruck || gameState === 'success') && dismissedFor !== gameState
  // instead of local component state mirroring context state -- see the
  // Phase 5 note in the modernization plan for why that matters (it also
  // fixes a cross-component bug: Header's "New game" couldn't reset
  // GameBoard's local dismissal state, since they're siblings).
  dismissedFor: GameStatus | null;
}
