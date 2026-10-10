import _ from 'lodash';
import React from 'react';
import GameBoard from './board'

export default class Minesweeper extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="minesweeper">
               <GameBoard></GameBoard>
            </div>
        );
    }
}