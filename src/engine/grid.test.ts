import { describe, expect, it } from 'vitest';
import { getNeighbors } from './grid';
import type { Board, Position } from './types';

function makeGrid(size: number): Board<Position> {
  const grid: Board<Position> = [];
  for (let x = 0; x < size; x++) {
    grid[x] = [];
    for (let y = 0; y < size; y++) {
      grid[x][y] = { x, y };
    }
  }
  return grid;
}

describe('getNeighbors', () => {
  const grid = makeGrid(3);

  it('returns all 8 neighbors for a center cell', () => {
    expect(getNeighbors({ x: 1, y: 1 }, grid)).toHaveLength(8);
  });

  it('returns only 3 neighbors for a corner cell', () => {
    const neighbors = getNeighbors({ x: 0, y: 0 }, grid);
    expect(neighbors).toHaveLength(3);
    expect(neighbors).toEqual(
      expect.arrayContaining([
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ])
    );
  });

  it('returns only 5 neighbors for an edge cell', () => {
    expect(getNeighbors({ x: 1, y: 0 }, grid)).toHaveLength(5);
  });

  it('returns an empty array for an empty grid', () => {
    expect(getNeighbors({ x: 0, y: 0 }, [])).toEqual([]);
  });
});
