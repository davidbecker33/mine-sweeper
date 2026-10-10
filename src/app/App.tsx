import React from 'react';
import Header from './Header';
import Minesweeper from '../games/minesweeper/components/Minesweeper';

export default class App extends React.Component {
  render() {
    return (
      <div id="main" className="container">
        <Header />

        <div id="content" className="text-center">
          <Minesweeper />
        </div>

      </div>
    );
  }
}
