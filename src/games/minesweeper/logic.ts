import { getNeighbors } from '../../engine/grid';
import type { Cell, MinesweeperBoard } from './types';

const DIMENSION = 9;
const MINE_COUNT = 10;

export function generateNewBoardBlocks(): MinesweeperBoard {
  const board: MinesweeperBoard = [];
  let counter = 1;

  for (let i = 0; i < DIMENSION; i++) {
    board[i] = [];
    for (let j = 0; j < DIMENSION; j++) {
      board[i][j] = {
        key: counter,
        x: i,
        y: j,
        visited: false,
        isMine: false,
        count: 0
      };
      counter++;
    }
  }
  generateRandomMineNodes(DIMENSION, board);

  return board;
}

// Reveal replaces the cell object at [x][y] rather than mutating its
// `visited` property in place. Block is wrapped in React.memo and compares
// its `block` prop by reference -- an in-place mutation leaves that
// reference unchanged, so the memoized cell would never re-render even
// though its data changed underneath it.
function reveal(gameBlocks: MinesweeperBoard, cell: Cell): Cell {
  const revealed = { ...cell, visited: true };
  gameBlocks[cell.x][cell.y] = revealed;
  return revealed;
}

export function processBlockAction(block: Cell, gameBlocks: MinesweeperBoard): MinesweeperBoard {
  reveal(gameBlocks, block);

  if (block.count === 0) {
    const nodes = getNeighbors(block, gameBlocks).filter((node) => !node.visited);

    for (const n of nodes) {
      if (!n.isMine) {
        if (n.count === 0) {
          processBlockAction(n, gameBlocks);
        } else {
          reveal(gameBlocks, n);
        }
      }
    }
  }
  return gameBlocks;
}

export function processMineBlockAction(_block: Cell, gameBlocks: MinesweeperBoard): MinesweeperBoard {
  // reveal all mines, the game is over
  gameBlocks.forEach((row) => {
    row.forEach((cell) => {
      if (cell.isMine) {
        reveal(gameBlocks, cell);
      }
    });
  });

  return gameBlocks;
}

export function generateRandomMineNodes(dimension: number, gameBlocks: MinesweeperBoard): void {
  const randomNodes: number[] = [];
  const blockCount = dimension * dimension;

  for (let i = 0; i < MINE_COUNT; i++) {
    randomNodes.push(Math.floor(Math.random() * blockCount - 1) + 1);
  }

  gameBlocks.forEach((row) => {
    row.forEach((block) => {
      if (randomNodes.indexOf(block.key) >= 0) {
        block.isMine = true;

        getNeighbors(block, gameBlocks).forEach((node) => {
          node.count = node.count + 1;
        });
      }
    });
  });
}

export function processGameState(gameBlocks: MinesweeperBoard): boolean {
  let isSuccess = true;

  gameBlocks.forEach((row) => {
    row.forEach((block) => {
      if (!block.isMine && !block.visited) {
        isSuccess = false;
      }
    });
  });

  return isSuccess;
}
