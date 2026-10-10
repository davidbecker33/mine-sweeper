import { describe, expect, it } from 'vitest';
import { gameActions } from './actions';
import gameReducer, { initialState } from './reducer';
import type { Cell, GameState } from './types';

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return { key: 1, x: 0, y: 0, isMine: false, visited: false, count: 0, ...overrides };
}

describe('gameReducer', () => {
  it('CREATE_NEW_GAME produces a fresh 9x9 board and resets result/dismissal state', () => {
    const state = gameReducer(initialState, gameActions.createNewGame());

    expect(state.blocks).toHaveLength(9);
    expect(state.score).toBe(0);
    expect(state.isMineStruck).toBe(false);
    expect(state.gameState).toBe('new');
    expect(state.dismissedFor).toBeNull();
  });

  it('PROCESS_CLICK on a safe cell that does not complete the board leaves gameState unchanged, not "failed"', () => {
    // Regression test for the bug described in docs/modernization-plan.md's
    // Phase 5 note: the reducer used to force gameState to 'failed' on
    // every non-winning click. processGameState(blocks) only answers "has
    // the player won" -- a false result means "keep playing", not "lost".
    const board = [
      [makeCell({ x: 0, y: 0, count: 1 }), makeCell({ key: 2, x: 0, y: 1, isMine: true })],
      [makeCell({ key: 3, x: 1, y: 0, count: 1 }), makeCell({ key: 4, x: 1, y: 1, count: 1 })]
    ];
    const state: GameState = { blocks: board, score: 0, isMineStruck: false, gameState: 'new', dismissedFor: null };

    const next = gameReducer(state, gameActions.processClick(board[0][0]));

    expect(next.gameState).toBe('new');
    expect(next.blocks[0][0].visited).toBe(true);
  });

  it('PROCESS_CLICK that reveals the last safe cell sets gameState to success', () => {
    const board = [[makeCell({ x: 0, y: 0, count: 0 }), makeCell({ key: 2, x: 0, y: 1, isMine: true })]];
    const state: GameState = { blocks: board, score: 0, isMineStruck: false, gameState: 'new', dismissedFor: null };

    const next = gameReducer(state, gameActions.processClick(board[0][0]));

    expect(next.gameState).toBe('success');
  });

  it('PROCESS_MINE_CLICK sets isMineStruck, gameState to failed, resets score, and reveals mines', () => {
    const board = [[makeCell({ x: 0, y: 0, isMine: true }), makeCell({ key: 2, x: 0, y: 1 })]];
    const state: GameState = { blocks: board, score: 5, isMineStruck: false, gameState: 'new', dismissedFor: null };

    const next = gameReducer(state, gameActions.processMineClick(board[0][0]));

    expect(next.isMineStruck).toBe(true);
    expect(next.gameState).toBe('failed');
    expect(next.score).toBe(0);
    expect(next.blocks[0][0].visited).toBe(true);
  });

  it('DISMISS_RESULT records which gameState value was dismissed', () => {
    const state: GameState = { blocks: [], score: 0, isMineStruck: true, gameState: 'failed', dismissedFor: null };

    const next = gameReducer(state, gameActions.dismissResult());

    expect(next.dismissedFor).toBe('failed');
  });

  it('CREATE_NEW_GAME clears a prior dismissal, so the next result can show again', () => {
    const state: GameState = { blocks: [], score: 0, isMineStruck: true, gameState: 'failed', dismissedFor: 'failed' };

    const next = gameReducer(state, gameActions.createNewGame());

    expect(next.dismissedFor).toBeNull();
  });
});
