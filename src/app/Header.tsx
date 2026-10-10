import { useState, type MouseEvent } from 'react';
import { useGame } from '../games/minesweeper/context';
import { gameActions } from '../games/minesweeper/actions';
import { cn } from '../engine/cn';

// Plain Bootstrap-3-classed markup standing in for react-bootstrap's
// <Navbar>/<NavDropdown>, which crash under React 19 (legacy string refs /
// removed childContextTypes API). Replaced wholesale by Phase 6's Tailwind
// nav rather than upgrading this to react-bootstrap v2.
export default function Header() {
  const { dispatch } = useGame();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  function toggleDropdown(e: MouseEvent) {
    e.preventDefault();
    setDropdownOpen((open) => !open);
  }

  function playAgain(e: MouseEvent) {
    e.preventDefault();
    setDropdownOpen(false);
    dispatch(gameActions.createNewGame());
  }

  return (
    <div id="header">
      <nav className="navbar navbar-default">
        <div className="container-fluid">
          <div className="navbar-header">
            <a className="navbar-brand" href="#">
              MineSweeper
            </a>
          </div>
          <ul className="nav navbar-nav">
            <li className={cn({ dropdown: true, open: dropdownOpen })}>
              <a className="dropdown-toggle" href="#" role="button" onClick={toggleDropdown}>
                Game <span className="caret"></span>
              </a>
              <ul className="dropdown-menu">
                <li>
                  <a href="#" onClick={playAgain}>
                    New game
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
