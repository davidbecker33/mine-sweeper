import { memo, type KeyboardEvent } from 'react';
import { cn } from '../../../engine/cn';
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

function Block({ block, focused, onActivate, onNavigate, registerRef }: BlockProps) {
  return (
    <button
      type="button"
      ref={(el) => registerRef(block, el)}
      role="gridcell"
      tabIndex={focused ? 0 : -1}
      aria-label={describeCell(block)}
      className={cn({ active: !block.visited, inactive: block.visited })}
      onClick={() => onActivate(block)}
      onKeyDown={(e) => onNavigate(e, block)}
    >
      <span className={cn({ visible: block.isMine, mine: block.isMine })}></span>
      <span
        className={cn({
          hidden: !block.visited || block.isMine,
          'prox-1': block.count === 1,
          'prox-2': block.count === 2,
          'prox-3': block.count === 3
        })}
      >
        {block.count === 0 ? '' : block.count}
      </span>
    </button>
  );
}

export default memo(Block);
