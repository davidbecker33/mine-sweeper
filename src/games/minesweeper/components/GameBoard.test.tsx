import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GameProvider } from '../context';
import type { MinesweeperBoard } from '../types';
import GameBoard from './GameBoard';

// A fixed 2x2 board (one mine at Row 2/Column 2) so interactions can be
// asserted precisely, instead of against generateNewBoardBlocks' real
// randomness. The rest of ./logic (flood fill, win check, mine reveal) is
// exercised for real -- only board generation is replaced.
vi.mock('../logic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../logic')>();
  return {
    ...actual,
    generateNewBoardBlocks: (): MinesweeperBoard => [
      [
        { key: 1, x: 0, y: 0, isMine: false, visited: false, count: 1 },
        { key: 2, x: 0, y: 1, isMine: false, visited: false, count: 1 }
      ],
      [
        { key: 3, x: 1, y: 0, isMine: false, visited: false, count: 1 },
        { key: 4, x: 1, y: 1, isMine: true, visited: false, count: 0 }
      ]
    ]
  };
});

function renderBoard() {
  return render(
    <GameProvider>
      <GameBoard />
    </GameProvider>
  );
}

describe('GameBoard', () => {
  it('renders the board as an ARIA grid with one row/gridcell per board cell', async () => {
    renderBoard();
    expect(await screen.findByRole('grid')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });

  it('reveals a safe cell on click without opening the modal', async () => {
    renderBoard();
    await userEvent.click(await screen.findByRole('gridcell', { name: /Row 1, Column 1,/ }));

    expect(screen.getByRole('gridcell', { name: /Row 1, Column 1, revealed/ })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('clicking the mine reveals it and opens the loss modal', async () => {
    renderBoard();
    await userEvent.click(await screen.findByRole('gridcell', { name: /Row 2, Column 2,/ }));

    expect(await screen.findByText('Oooops!!')).toBeInTheDocument();
    // Radix Dialog marks the rest of the page aria-hidden while open (real
    // modal-inerting behavior our old hand-rolled one never had) -- `hidden:
    // true` is needed to still inspect it here.
    expect(screen.getByRole('gridcell', { name: /Row 2, Column 2, mine/, hidden: true })).toBeInTheDocument();
  });

  it('Close dismisses the modal, and it does not reopen on a later safe click', async () => {
    renderBoard();
    await userEvent.click(await screen.findByRole('gridcell', { name: /Row 2, Column 2,/ }));
    await screen.findByText('Oooops!!');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Oooops!!')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('gridcell', { name: /Row 1, Column 1,/ }));
    expect(screen.queryByText('Oooops!!')).not.toBeInTheDocument();
  });

  it('"Play again?" starts a fresh game and closes the modal', async () => {
    renderBoard();
    await userEvent.click(await screen.findByRole('gridcell', { name: /Row 2, Column 2,/ }));
    await screen.findByText('Oooops!!');

    await userEvent.click(screen.getByRole('button', { name: 'Play again?' }));

    expect(screen.queryByText('Oooops!!')).not.toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: /Row 2, Column 2, hidden/ })).toBeInTheDocument();
  });
});
