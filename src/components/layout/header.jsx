import _ from 'lodash';
import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { gameActions } from '../action/actions';
import { Navbar, Nav, NavDropdown, MenuItem } from 'react-bootstrap';

function mapStateToProps(store) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(gameActions, dispatch) };
}

class Header extends React.Component {
  constructor(props) {
    super(props);
  }

  playAgain() {
    this.props.actions.createNewGame();
  }

  render() {
    return (
      <div id="header">
        <Navbar>
          <Navbar.Header>
            <Navbar.Brand>
              <a href="#">MineSweeper</a>
            </Navbar.Brand>
          </Navbar.Header>
          <Nav>
            <NavDropdown eventKey={3} title="Game" id="basic-nav-dropdown">
              <MenuItem eventKey={3.1}><div onClick={this.playAgain.bind(this)}>New game</div></MenuItem>
            </NavDropdown>
          </Nav>
        </Navbar>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);