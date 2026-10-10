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

export function processBlockAction(block: Cell, gameBlocks: MinesweeperBoard): MinesweeperBoard {
  // set as visited
  gameBlocks[block.x][block.y].visited = true;

  if (block.count === 0) {
    const nodes = getNeighbors(block, gameBlocks).filter((node) => !node.visited);

    for (const n of nodes) {
      if (!n.isMine) {
        if (n.count === 0) {
          processBlockAction(n, gameBlocks);
        } else {
          gameBlocks[n.x][n.y].visited = true;
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
        gameBlocks[cell.x][cell.y].visited = true;
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
