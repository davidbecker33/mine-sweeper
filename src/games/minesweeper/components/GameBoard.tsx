import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import useSound from 'use-sound';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useGame } from '../context';
import { gameActions } from '../actions';
import Block from './Block';
import type { Cell } from '../types';
import revealSoundUrl from '../sounds/reveal.wav';
import winSoundUrl from '../sounds/win.wav';
import loseSoundUrl from '../sounds/lose.wav';

function cellKey(x: number, y: number): string {
  return `${x}-${y}`;
}

export default function GameBoard() {
  const { state, dispatch } = useGame();
  const { blocks, gameState, isMineStruck, dismissedFor } = state;

  // Pure derived value rather than local state mirroring context state (and
  // rather than a useEffect calling setState to "sync" it) -- the reducer
  // owns dismissal via `dismissedFor` (see its field comment in types.ts)
  // specifically so this can be computed, not tracked. That also sidesteps
  // a bug that plagued an earlier local-state version of this: Header's
  // "New game" dispatches CREATE_NEW_GAME too, and a GameBoard-local
  // "dismissed" flag would never see that reset, since they're siblings.
  const showModal = (isMineStruck || gameState === 'success') && dismissedFor !== gameState;

  const [focusedPosition, setFocusedPosition] = useState({ x: 0, y: 0 });
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());

  // Board dimensions never change at runtime (always a fixed 9x9 -- see
  // DIMENSION in logic.ts), so these are stable across re-renders despite
  // being recomputed from `blocks`, which keeps moveFocus below stable too.
  const height = blocks.length;
  const width = blocks[0]?.length ?? 0;

  // use-sound's play functions stabilize (via its own internal useCallback)
  // once each sound finishes its initial async load, same as dispatch --
  // safe to depend on below without threatening handleActivate's stability
  // (see its own note on why that matters for Block's React.memo).
  const [playReveal] = useSound(revealSoundUrl, { volume: 0.4 });
  const [playWin] = useSound(winSoundUrl, { volume: 0.5 });
  const [playLose] = useSound(loseSoundUrl, { volume: 0.5 });

  useEffect(() => {
    dispatch(gameActions.createNewGame());
  }, [dispatch]);

  // Each fires once per actual transition (useEffect's dependency diffing),
  // not on every render -- so these don't replay on, say, a focus change.
  useEffect(() => {
    if (isMineStruck) {
      playLose();
    }
  }, [isMineStruck, playLose]);

  useEffect(() => {
    if (gameState === 'success') {
      playWin();
    }
  }, [gameState, playWin]);

  const close = useCallback(() => dispatch(gameActions.dismissResult()), [dispatch]);

  const playAgain = useCallback(() => dispatch(gameActions.createNewGame()), [dispatch]);

  const handleActivate = useCallback(
    (block: Cell) => {
      if (!block.visited) {
        if (block.isMine) {
          dispatch(gameActions.processMineClick(block));
        } else {
          dispatch(gameActions.processClick(block));
          playReveal();
        }
      }
    },
    [dispatch, playReveal]
  );

  const moveFocus = useCallback(
    (x: number, y: number) => {
      if (height === 0 || width === 0) {
        return;
      }
      const clampedX = Math.min(Math.max(x, 0), height - 1);
      const clampedY = Math.min(Math.max(y, 0), width - 1);
      setFocusedPosition({ x: clampedX, y: clampedY });
      cellRefs.current.get(cellKey(clampedX, clampedY))?.focus();
    },
    [height, width]
  );

  const handleNavigate = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, block: Cell) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          moveFocus(block.x - 1, block.y);
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveFocus(block.x + 1, block.y);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          moveFocus(block.x, block.y - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveFocus(block.x, block.y + 1);
          break;
      }
    },
    [moveFocus]
  );

  const registerCellRef = useCallback((block: Cell, el: HTMLButtonElement | null) => {
    const key = cellKey(block.x, block.y);
    if (el) {
      cellRefs.current.set(key, el);
    } else {
      cellRefs.current.delete(key);
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid gap-0.5 rounded-md bg-border p-0.5 shadow-sm"
        style={{ gridTemplateColumns: `repeat(${width}, calc(var(--spacing) * 8))` }}
        role="grid"
        aria-label="Minesweeper board"
      >
        {blocks.map((row, x) => (
          // display: contents (Tailwind's `contents`) keeps role="row" in
          // the accessibility tree without taking this div out of the CSS
          // grid above -- its <Block> children participate directly.
          <div className="contents" role="row" key={x}>
            {row.map((block, y) => (
              <Block
                key={block.key}
                block={block}
                focused={focusedPosition.x === x && focusedPosition.y === y}
                onActivate={handleActivate}
                onNavigate={handleNavigate}
                registerRef={registerCellRef}
              />
            ))}
          </div>
        ))}
      </div>

      <Dialog open={showModal} onOpenChange={(open) => !open && close()}>
        {/* The explicit "Close" button below already covers this (along
            with Esc and clicking outside, both still handled by Radix) --
            showing DialogContent's own auto-generated X button too would
            just be a second, ambiguously-identical "Close" control. */}
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>MineSweeper</DialogTitle>
          </DialogHeader>
          {gameState === 'success' && (
            <div className="space-y-1">
              <p className="font-semibold">Congratulations!!!</p>
              <p className="text-muted-foreground">You successfully avoided all mines.</p>
            </div>
          )}
          {gameState === 'failed' && (
            <div className="space-y-1">
              <p className="font-semibold">Oooops!!</p>
              <p className="text-muted-foreground">You accidentally clicked on a mine.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Close
            </Button>
            <Button onClick={playAgain}>Play again?</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
