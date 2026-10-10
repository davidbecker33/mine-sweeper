import React from 'react';
import { GameContext } from '../games/minesweeper/context';
import { gameActions } from '../games/minesweeper/actions';
import { cn } from '../engine/cn';

interface HeaderState {
  dropdownOpen: boolean;
}

// Plain Bootstrap-3-classed markup standing in for react-bootstrap's
// <Navbar>/<NavDropdown>, which crash under React 19 (legacy string refs /
// removed childContextTypes API). Replaced wholesale by Phase 6's Tailwind
// nav rather than upgrading this to react-bootstrap v2.
class Header extends React.Component<object, HeaderState> {
  // GameProvider always wraps the tree (see index.tsx), so unlike useGame()
  // -- which runtime-checks this for function components -- it's safe to
  // assert the non-null variant once here rather than at every access.
  static contextType = GameContext;
  declare context: NonNullable<React.ContextType<typeof GameContext>>;

  constructor(props: object) {
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
    this.context.dispatch(gameActions.createNewGame());
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

export default Header;
