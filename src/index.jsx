import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { HashRouter as Router, Route } from 'react-router-dom';
import App from './components/app';
import { generateNewBoardBlocks } from './components/util/board-utils';
import gameReducer from './components/reducer/reducer';


const blocks = generateNewBoardBlocks();

const initialState = {
     blocks: blocks,
     score: 0,
     isMineStruck: false,
     gameState: 'new'
}
const store = createStore(gameReducer, initialState);

render((
  <Provider store={store}>
	  <Router>
	    <Route path="/" component={App}/>
	  </Router>
  </Provider>
), document.getElementById('app'));
