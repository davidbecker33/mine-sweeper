import Header from './Header';
import Minesweeper from '../games/minesweeper/components/Minesweeper';

export default function App() {
  return (
    <div id="main" className="container">
      <Header />

      <div id="content" className="text-center">
        <Minesweeper />
      </div>
    </div>
  );
}
