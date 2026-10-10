import React from 'react';
import { bindActionCreators, type Dispatch } from 'redux';
import { connect, type ConnectedProps } from 'react-redux';
import { gameActions } from '../games/minesweeper/actions';
import { cn } from '../engine/cn';

function mapDispatchToProps(dispatch: Dispatch) {
  return { actions: bindActionCreators(gameActions, dispatch) };
}

const connector = connect(null, mapDispatchToProps);

type HeaderProps = ConnectedProps<typeof connector>;

interface HeaderState {
  dropdownOpen: boolean;
}

// Plain Bootstrap-3-classed markup standing in for react-bootstrap's
// <Navbar>/<NavDropdown>, which crash under React 19 (legacy string refs /
// removed childContextTypes API). Replaced wholesale by Phase 6's Tailwind
// nav rather than upgrading this to react-bootstrap v2.
class Header extends React.Component<HeaderProps, HeaderState> {
  constructor(props: HeaderProps) {
    super(props);
    this.state = { dropdownOpen: false };
  }

  toggleDropdown(e: React.MouseEvent) {
    e.preventDefault();
    this.setState({ dropdownOpen: !this.state.dropdownOpen });
  }

  playAgain(e: React.MouseEvent) {
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
              <li className={cn({ dropdown: true, open: this.state.dropdownOpen })}>
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

export default connector(Header);
