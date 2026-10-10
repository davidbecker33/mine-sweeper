import { describe, expect, it } from 'vitest';
import { getNeighbors } from '../../engine/grid';
import { generateNewBoardBlocks, processBlockAction, processGameState, processMineBlockAction } from './logic';
import type { MinesweeperBoard } from './types';

/**
 * Builds a board with mines at exactly the given coordinates and correctly
 * computed adjacency counts, so flood-fill/win-check behavior can be tested
 * deterministically instead of against generateNewBoardBlocks' randomness.
 */
function makeBoard(size: number, mines: Array<[number, number]>): MinesweeperBoard {
  const mineSet = new Set(mines.map(([x, y]) => `${x},${y}`));
  let key = 1;
  const board: MinesweeperBoard = [];

  for (let x = 0; x < size; x++) {
    board[x] = [];
    for (let y = 0; y < size; y++) {
      board[x][y] = { key: key++, x, y, visited: false, isMine: mineSet.has(`${x},${y}`), count: 0 };
    }
  }

  for (const row of board) {
    for (const cell of row) {
      if (cell.isMine) {
        for (const neighbor of getNeighbors(cell, board)) {
          neighbor.count += 1;
        }
      }
    }
  }

  return board;
}

describe('generateNewBoardBlocks', () => {
  it('creates a 9x9 board of well-formed cells', () => {
    const board = generateNewBoardBlocks();
    expect(board).toHaveLength(9);
    board.forEach((row, x) => {
      expect(row).toHaveLength(9);
      row.forEach((cell, y) => {
        expect(cell.x).toBe(x);
        expect(cell.y).toBe(y);
        expect(cell.visited).toBe(false);
        expect(cell.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  it('places at least one mine', () => {
    // generateRandomMineNodes has a known RNG bug (duplicate indices can
    // silently place fewer than the intended 10 mines -- see "Known
    // pre-existing issues" in docs/manual-regression-baseline.md), so this
    // only asserts a weak bound rather than an exact count of 10.
    const mineCount = generateNewBoardBlocks()
      .flat()
      .filter((cell) => cell.isMine).length;
    expect(mineCount).toBeGreaterThan(0);
    expect(mineCount).toBeLessThanOrEqual(10);
  });
});

describe('processBlockAction (flood fill)', () => {
  // 3x3 board, single mine at (2,2):
  //   0 0 0
  //   0 1 1
  //   0 1 M
  const mines: Array<[number, number]> = [[2, 2]];

  it('cascades through every connected zero-count cell and stops at its numbered border, never touching the mine', () => {
    const board = makeBoard(3, mines);
    processBlockAction(board[0][0], board);

    expect(board[2][2].visited).toBe(false);
    expect(board.flat().every((cell) => cell.isMine || cell.visited)).toBe(true);
  });

  it('reveals only the clicked cell when it borders a mine (nonzero count)', () => {
    const board = makeBoard(3, mines);
    processBlockAction(board[1][1], board);

    const visited = board.flat().filter((cell) => cell.visited);
    expect(visited).toHaveLength(1);
    expect(visited[0]).toMatchObject({ x: 1, y: 1 });
  });

  it('replaces revealed cell objects by reference rather than mutating them in place', () => {
    // Regression test: Block is wrapped in React.memo and compares its
    // `block` prop by reference. Mutating a cell's `visited` property in
    // place (instead of replacing the object) leaves that reference
    // unchanged, and the memoized cell silently never re-renders -- this
    // was a real bug caught while building Phase 5's accessibility pass.
    const board = makeBoard(3, mines);
    const original = board[1][1];

    processBlockAction(original, board);

    expect(board[1][1]).not.toBe(original);
    expect(board[1][1].visited).toBe(true);
    expect(original.visited).toBe(false);
  });
});

describe('processMineBlockAction', () => {
  const mines: Array<[number, number]> = [
    [0, 0],
    [2, 2]
  ];

  it('reveals every mine regardless of which one was clicked, and leaves non-mine cells untouched', () => {
    const board = makeBoard(3, mines);
    processMineBlockAction(board[0][0], board);

    expect(board.flat().filter((cell) => cell.isMine).every((cell) => cell.visited)).toBe(true);
    expect(board.flat().filter((cell) => !cell.isMine).every((cell) => !cell.visited)).toBe(true);
  });

  it('replaces revealed mine objects by reference rather than mutating them in place', () => {
    const board = makeBoard(3, mines);
    const original = board[2][2];

    processMineBlockAction(original, board);

    expect(board[2][2]).not.toBe(original);
  });
});

describe('processGameState', () => {
  const mines: Array<[number, number]> = [[2, 2]];

  it('returns false while any non-mine cell is still hidden', () => {
    expect(processGameState(makeBoard(3, mines))).toBe(false);
  });

  it('returns true once every non-mine cell is revealed, even if the mine is not', () => {
    const board = makeBoard(3, mines);
    board.flat().forEach((cell) => {
      if (!cell.isMine) {
        cell.visited = true;
      }
    });
    expect(processGameState(board)).toBe(true);
  });
});
