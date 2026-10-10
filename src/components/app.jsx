import _ from 'lodash';
import React from 'react';
import Header from './layout/header';
import Footer from './layout/footer';
import Minesweeper from './ms/minesweeper';

export default class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div id="main" className="container">
              <Header/>
              
                <div id="content" className="text-center">
                   <Minesweeper></Minesweeper>
                </div>
               
             
            </div>
        );
    }

  
}
