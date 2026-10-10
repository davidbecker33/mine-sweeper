import React from 'react';
import { bindActionCreators, type Dispatch } from 'redux';
import { connect, type ConnectedProps } from 'react-redux';
import { gameActions } from '../actions';
import Block from './Block';
import { cn } from '../../../engine/cn';
import type { Cell, GameState } from '../types';

function mapStateToProps(store: GameState) {
  return {
    blocks: store.blocks,
    score: store.score,
    isMineStruck: store.isMineStruck,
    gameState: store.gameState
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return { actions: bindActionCreators(gameActions, dispatch) };
}

const connector = connect(mapStateToProps, mapDispatchToProps);

type GameBoardProps = ConnectedProps<typeof connector>;

interface GameBoardState {
  showModal: boolean;
}

class GameBoard extends React.Component<GameBoardProps, GameBoardState> {

  constructor(props: GameBoardProps) {
    super(props);
    this.state = { showModal: false };
  }

  componentWillMount() {
    this.props.actions.createNewGame();
  }

  componentWillReceiveProps(nextProps: GameBoardProps) {

    if (nextProps.isMineStruck || nextProps.gameState === 'success') {
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
        this.props.actions.processMineClick(block);
      } else {
        this.props.actions.processClick(block);
      }
    }

  }

  playAgain() {
    this.close();
    this.props.actions.createNewGame();
  }

  getBlocks() {

    let mappedBlocks: React.ReactElement[] = [];
    let yIndex = 0;
    this.props.blocks.forEach((xblocks, index) => {

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
                  <div className={cn({ hidden: this.props.gameState !== 'success' })}>
                    <h4>Congratulations!!!</h4>
                    <p>You successfully avoided all mines.</p>
                    <p><a href="#" onClick={this.playAgain.bind(this)} >Play again?</a></p>
                  </div>
                  <div className={cn({ hidden: this.props.gameState !== 'failed' })}>
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

export default connector(GameBoard);
