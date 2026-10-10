import React from 'react';
import GameBoard from './GameBoard';

export default class Minesweeper extends React.Component {

  render() {
    return (
      <div id="minesweeper">
        <GameBoard />
      </div>
    );
  }
}
