import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Block from './Block';
import type { Cell } from '../types';

function makeCell(overrides: Partial<Cell> = {}): Cell {
  return { key: 1, x: 0, y: 0, isMine: false, visited: false, count: 0, ...overrides };
}

const noop = () => {};

describe('Block', () => {
  it('renders a hidden cell as a non-tabbable gridcell with a position-and-state label', () => {
    render(
      <Block block={makeCell({ x: 2, y: 3 })} focused={false} onActivate={noop} onNavigate={noop} registerRef={noop} />
    );

    const cell = screen.getByRole('gridcell', { name: 'Row 3, Column 4, hidden' });
    expect(cell).toHaveAttribute('tabindex', '-1');
  });

  it('marks the focused cell as the one tabbable cell (roving tabindex)', () => {
    render(<Block block={makeCell()} focused onActivate={noop} onNavigate={noop} registerRef={noop} />);

    expect(screen.getByRole('gridcell')).toHaveAttribute('tabindex', '0');
  });

  it('describes a revealed empty cell', () => {
    render(
      <Block
        block={makeCell({ visited: true, count: 0 })}
        focused={false}
        onActivate={noop}
        onNavigate={noop}
        registerRef={noop}
      />
    );

    expect(screen.getByRole('gridcell', { name: /revealed, empty/ })).toBeInTheDocument();
  });

  it('describes a revealed numbered cell, pluralizing "mine(s)" correctly', () => {
    render(
      <Block
        block={makeCell({ visited: true, count: 1 })}
        focused={false}
        onActivate={noop}
        onNavigate={noop}
        registerRef={noop}
      />
    );
    expect(screen.getByRole('gridcell', { name: /1 adjacent mine$/ })).toBeInTheDocument();

    const { unmount } = render(
      <Block
        block={makeCell({ visited: true, count: 2 })}
        focused={false}
        onActivate={noop}
        onNavigate={noop}
        registerRef={noop}
      />
    );
    expect(screen.getByRole('gridcell', { name: /2 adjacent mines/ })).toBeInTheDocument();
    unmount();
  });

  it('describes a struck mine', () => {
    render(
      <Block
        block={makeCell({ visited: true, isMine: true })}
        focused={false}
        onActivate={noop}
        onNavigate={noop}
        registerRef={noop}
      />
    );
    expect(screen.getByRole('gridcell', { name: /mine$/ })).toBeInTheDocument();
  });

  it('calls onActivate with the cell when clicked', async () => {
    const onActivate = vi.fn();
    const cell = makeCell();
    render(<Block block={cell} focused={false} onActivate={onActivate} onNavigate={noop} registerRef={noop} />);

    await userEvent.click(screen.getByRole('gridcell'));

    expect(onActivate).toHaveBeenCalledWith(cell);
  });

  it('calls onNavigate with the key event and the cell on keydown', async () => {
    const onNavigate = vi.fn();
    const cell = makeCell();
    render(<Block block={cell} focused onActivate={noop} onNavigate={onNavigate} registerRef={noop} />);

    screen.getByRole('gridcell').focus();
    await userEvent.keyboard('{ArrowRight}');

    expect(onNavigate).toHaveBeenCalledTimes(1);
    expect(onNavigate.mock.calls[0][1]).toBe(cell);
  });
});
