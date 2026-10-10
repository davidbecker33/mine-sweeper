import _ from 'lodash';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { gameActions } from '../action/actions'
import Block from './block';
import Counter from '../util/counter';
import { rjsClass } from '../util/rjs-directives';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter, Button } from 'react-bootstrap';

function mapStateToProps(store) {
  return {
    blocks: store.blocks,
    score: store.score,
    isMineStruck: store.isMineStruck,
    gameState: store.gameState
  };
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(gameActions, dispatch) };
}

class GameBoard extends React.Component {

  constructor(props) {
    super(props);
    this.state = { showModal: false };
  }

  componentWillMount() {
    this.props.actions.createNewGame();
  }

  componentWillUpdate(nextProps, nextState) {
  }

  componentDidUpdate(prevProps, prevState) {
  }

  componentWillReceiveProps(nextProps) {

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

  processAction(block) {

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

    let mappedBlocks = [], yblocks;
    let yIndex = 0;
    this.props.blocks.forEach((xblocks, index) => {

      yblocks = xblocks.map((block) => {

        return (<Block key={index + yIndex++} onClick={this.processAction.bind(this, block)} isMine={block.isMine} visited={block.visited} x={block.x} y={block.y} count={block.count} />)
      });
      mappedBlocks = mappedBlocks.concat(yblocks);
    });

    return mappedBlocks;

  }
  render() {

    return (
      <div className="board-container">

        <div className="board"> {this.getBlocks()} </div>

        <Modal show={this.state.showModal} onHide={this.close.bind(this)}>
          <Modal.Header closeButton>
            <Modal.Title>MineSweeper</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className={rjsClass({ 'hidden': this.props.gameState !== 'success' })}>
              <h4>Congratulations!!!</h4>
              <p>You successfully avoided all mines.</p>
              <p><a href="#" onClick={this.playAgain.bind(this)} >Play again?</a></p>
            </div>
            <div className={rjsClass({ 'hidden': this.props.gameState !== 'failed' })}>
              <h4>Oooops!!</h4>
              <p>You accidentally clicked on a mine.</p>
              <p><a href="#" onClick={this.playAgain.bind(this)} >Play again?</a></p>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.close.bind(this)}>Close</Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GameBoard);