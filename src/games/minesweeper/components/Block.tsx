import { memo, type KeyboardEvent } from 'react';
import { BombIcon } from 'lucide-react';
import { cn } from '@/engine/cn';
import type { Cell } from '../types';

interface BlockProps {
  block: Cell;
  focused: boolean;
  // All three take `block` as an argument rather than being pre-bound per
  // cell, so GameBoard can pass the *same* function reference to every
  // Block regardless of which cell changed -- required for React.memo
  // below to actually skip re-rendering untouched cells. See GameBoard's
  // implementation note on handleActivate/handleNavigate/registerCellRef.
  onActivate: (block: Cell) => void;
  onNavigate: (e: KeyboardEvent<HTMLButtonElement>, block: Cell) => void;
  registerRef: (block: Cell, el: HTMLButtonElement | null) => void;
}

function describeCell(block: Cell): string {
  const position = `Row ${block.x + 1}, Column ${block.y + 1}`;

  if (!block.visited) {
    return `${position}, hidden`;
  }
  if (block.isMine) {
    return `${position}, mine`;
  }
  if (block.count === 0) {
    return `${position}, revealed, empty`;
  }
  return `${position}, revealed, ${block.count} adjacent mine${block.count === 1 ? '' : 's'}`;
}

// Classic Minesweeper mine-count color coding, extended from the original
// CSS's 1-3 to the full 1-8 range a 9x9 board (max 8 neighbors) can produce.
const COUNT_COLOR: Record<number, string> = {
  1: 'text-blue-600 dark:text-blue-400',
  2: 'text-green-600 dark:text-green-400',
  3: 'text-red-600 dark:text-red-400',
  4: 'text-indigo-700 dark:text-indigo-400',
  5: 'text-rose-800 dark:text-rose-400',
  6: 'text-teal-600 dark:text-teal-400',
  7: 'text-foreground',
  8: 'text-muted-foreground'
};

function Block({ block, focused, onActivate, onNavigate, registerRef }: BlockProps) {
  return (
    <button
      type="button"
      ref={(el) => registerRef(block, el)}
      role="gridcell"
      tabIndex={focused ? 0 : -1}
      aria-label={describeCell(block)}
      data-state={block.visited ? 'revealed' : 'hidden'}
      data-mine={block.isMine || undefined}
      className={cn(
        'flex size-8 items-center justify-center border text-sm font-bold select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        block.visited
          ? 'border-border/60 bg-background'
          : 'border-border bg-muted shadow-[inset_1px_1px_0_var(--color-background),inset_-1px_-1px_0_rgba(0,0,0,0.15)] hover:brightness-95 active:translate-y-px',
        block.visited && block.isMine && 'bg-destructive/15'
      )}
      onClick={() => onActivate(block)}
      onKeyDown={(e) => onNavigate(e, block)}
    >
      {block.visited && block.isMine && <BombIcon className="size-4 text-destructive" />}
      {block.visited && !block.isMine && block.count > 0 && (
        <span className={COUNT_COLOR[block.count]}>{block.count}</span>
      )}
    </button>
  );
}

export default memo(Block);
