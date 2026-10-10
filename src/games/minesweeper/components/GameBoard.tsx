import React from 'react';
import { GameContext } from '../context';
import { gameActions } from '../actions';
import Block from './Block';
import { cn } from '../../../engine/cn';
import type { Cell, GameState } from '../types';

interface GameBoardState {
  showModal: boolean;
}

class GameBoard extends React.Component<object, GameBoardState> {
  // GameProvider always wraps the tree (see index.tsx), so unlike useGame()
  // -- which runtime-checks this for function components -- it's safe to
  // assert the non-null variant once here rather than at every access.
  static contextType = GameContext;
  declare context: NonNullable<React.ContextType<typeof GameContext>>;

  // The reducer always returns a new state object per dispatch (`blocks` is
  // always a fresh array), so comparing this.context.state by reference
  // tells us "a dispatch just happened" -- which is what the old
  // componentWillReceiveProps(nextProps) reacted to (prop-change-driven,
  // via connect()). componentDidUpdate has no such distinction: it fires
  // after *any* re-render, including ones from this component's own
  // setState (open()/close()) -- reacting to those too would either loop
  // forever (open() re-triggers itself) or make close() a no-op (it'd
  // immediately reopen). Gating on the context reference restores the
  // "only react to an actual new dispatch" semantics.
  private lastState: GameState | null = null;

  constructor(props: object) {
    super(props);
    this.state = { showModal: false };
  }

  componentDidMount() {
    this.lastState = this.context.state;
    this.context.dispatch(gameActions.createNewGame());
  }

  componentDidUpdate() {
    if (this.context.state === this.lastState) {
      return;
    }
    this.lastState = this.context.state;

    const { isMineStruck, gameState } = this.context.state;
    if (isMineStruck || gameState === 'success') {
      this.open();
    }
  }

  close() {
    this.setState({ showModal: false });
  }

  open() {
    this.setState({ showModal: true });
  }

  processAction(block: Cell) {

    if (!block.visited) {
      if (block.isMine) {
        this.context.dispatch(gameActions.processMineClick(block));
      } else {
        this.context.dispatch(gameActions.processClick(block));
      }
    }

  }

  playAgain() {
    this.close();
    this.context.dispatch(gameActions.createNewGame());
  }

  getBlocks() {

    let mappedBlocks: React.ReactElement[] = [];
    let yIndex = 0;
    this.context.state.blocks.forEach((xblocks, index) => {

      const yblocks = xblocks.map((block) => {

        return (<Block key={index + yIndex++} onClick={this.processAction.bind(this, block)} isMine={block.isMine} visited={block.visited} x={block.x} y={block.y} count={block.count} />)
      });
      mappedBlocks = mappedBlocks.concat(yblocks);
    });

    return mappedBlocks;

  }

  // Plain Bootstrap-3-classed markup standing in for react-bootstrap's
  // <Modal>, which crashes under React 19 (legacy string refs / removed
  // childContextTypes API). Replaced wholesale by Phase 6's Tailwind/Radix
  // dialog rather than upgrading this to react-bootstrap v2.
  onBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      this.close();
    }
  }

  render() {
    const { gameState } = this.context.state;

    return (
      <div className="board-container">

        <div className="board"> {this.getBlocks()} </div>

        {this.state.showModal &&
          <div className="modal in" style={{ display: 'block' }} tabIndex={-1} role="dialog" onClick={this.onBackdropClick.bind(this)}>
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <button type="button" className="close" aria-label="Close" onClick={this.close.bind(this)}>
                    <span aria-hidden="true">&times;</span>
                  </button>
                  <h4 className="modal-title">MineSweeper</h4>
                </div>
                <div className="modal-body">
                  <div className={cn({ hidden: gameState !== 'success' })}>
                    <h4>Congratulations!!!</h4>
                    <p>You successfully avoided all mines.</p>
                    <p><a href="#" onClick={this.playAgain.bind(this)} >Play again?</a></p>
                  </div>
                  <div className={cn({ hidden: gameState !== 'failed' })}>
                    <h4>Oooops!!</h4>
                    <p>You accidentally clicked on a mine.</p>
                    <p><a href="#" onClick={this.playAgain.bind(this)} >Play again?</a></p>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-default" onClick={this.close.bind(this)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        }
        {this.state.showModal && <div className="modal-backdrop in"></div>}
      </div>
    );
  }
}

export default GameBoard;
