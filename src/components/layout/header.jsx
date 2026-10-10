import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { gameActions } from '../action/actions';
import { rjsClass } from '../util/rjs-directives';

function mapStateToProps(store) {
  return {};
}

function mapDispatchToProps(dispatch) {
  return { actions: bindActionCreators(gameActions, dispatch) };
}

// Plain Bootstrap-3-classed markup standing in for react-bootstrap's
// <Navbar>/<NavDropdown>, which crash under React 19 (legacy string refs /
// removed childContextTypes API). Replaced wholesale by Phase 6's Tailwind
// nav rather than upgrading this to react-bootstrap v2.
class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = { dropdownOpen: false };
  }

  toggleDropdown(e) {
    e.preventDefault();
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  playAgain(e) {
    e.preventDefault();
    this.setState({ dropdownOpen: false });
    this.props.actions.createNewGame();
  }

  render() {
    return (
      <div id="header">
        <nav className="navbar navbar-default">
          <div className="container-fluid">
            <div className="navbar-header">
              <a className="navbar-brand" href="#">MineSweeper</a>
            </div>
            <ul className="nav navbar-nav">
              <li className={rjsClass({ dropdown: true, open: this.state.dropdownOpen })}>
                <a className="dropdown-toggle" href="#" role="button" onClick={this.toggleDropdown.bind(this)}>
                  Game <span className="caret"></span>
                </a>
                <ul className="dropdown-menu">
                  <li><a href="#" onClick={this.playAgain.bind(this)}>New game</a></li>
                </ul>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Header);
