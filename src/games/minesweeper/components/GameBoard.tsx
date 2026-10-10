import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { useGame } from '../context';
import { gameActions } from '../actions';
import Block from './Block';
import type { Cell } from '../types';

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

  useEffect(() => {
    dispatch(gameActions.createNewGame());
  }, [dispatch]);

  const close = useCallback(() => dispatch(gameActions.dismissResult()), [dispatch]);

  const playAgain = useCallback(() => dispatch(gameActions.createNewGame()), [dispatch]);

  const handleActivate = useCallback(
    (block: Cell) => {
      if (!block.visited) {
        dispatch(block.isMine ? gameActions.processMineClick(block) : gameActions.processClick(block));
      }
    },
    [dispatch]
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

  // Plain Bootstrap-3-classed markup standing in for react-bootstrap's
  // <Modal>, which crashes under React 19 (legacy string refs / removed
  // childContextTypes API). Replaced wholesale by Phase 6's Tailwind/Radix
  // dialog rather than upgrading this to react-bootstrap v2.
  function onBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      close();
    }
  }

  return (
    <div className="board-container">
      <div className="board" role="grid" aria-label="Minesweeper board">
        {blocks.map((row, x) => (
          <div className="board-row" role="row" key={x}>
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

      {showModal && (
        <div className="modal in" style={{ display: 'block' }} tabIndex={-1} role="dialog" onClick={onBackdropClick}>
          <div className="modal-dialog" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" aria-label="Close dialog" onClick={close}>
                  <span aria-hidden="true">&times;</span>
                </button>
                <h4 className="modal-title">MineSweeper</h4>
              </div>
              <div className="modal-body">
                {gameState === 'success' && (
                  <div>
                    <h4>Congratulations!!!</h4>
                    <p>You successfully avoided all mines.</p>
                    <p>
                      <a href="#" onClick={playAgain}>
                        Play again?
                      </a>
                    </p>
                  </div>
                )}
                {gameState === 'failed' && (
                  <div>
                    <h4>Oooops!!</h4>
                    <p>You accidentally clicked on a mine.</p>
                    <p>
                      <a href="#" onClick={playAgain}>
                        Play again?
                      </a>
                    </p>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={close}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop in"></div>}
    </div>
  );
}
