import type { Board, Position } from './types';

/**
 * The 8 orthogonal/diagonal neighbors of a position within a rectangular
 * grid, skipping any that fall outside the grid's bounds. Generic over the
 * cell type so any 2D grid-based game (flood fill, match-3, Game of Life,
 * ...) can reuse it.
 */
export function getNeighbors<T extends Position>(pos: Position, grid: Board<T>): T[] {
  const { x, y } = pos;
  const neighbors: T[] = [];
  const row = grid[0];
  if (!row) {
    return neighbors;
  }
  const height = grid.length;
  const width = row.length;

  // left
  if (x > 0) {
    neighbors.push(grid[x - 1][y]);
  }
  // right
  if (x + 1 < height) {
    neighbors.push(grid[x + 1][y]);
  }
  // upper left
  if (x > 0 && y > 0) {
    neighbors.push(grid[x - 1][y - 1]);
  }
  // upper center
  if (y > 0) {
    neighbors.push(grid[x][y - 1]);
  }
  // upper right
  if (y > 0 && x + 1 < height) {
    neighbors.push(grid[x + 1][y - 1]);
  }
  // lower left
  if (x > 0 && y + 1 < width) {
    neighbors.push(grid[x - 1][y + 1]);
  }
  // lower center
  if (y + 1 < width) {
    neighbors.push(grid[x][y + 1]);
  }
  // lower right
  if (x + 1 < height && y + 1 < width) {
    neighbors.push(grid[x + 1][y + 1]);
  }

  return neighbors;
}
