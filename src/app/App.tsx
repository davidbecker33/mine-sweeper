import Header from './Header';
import Minesweeper from '../games/minesweeper/components/Minesweeper';

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="flex flex-1 items-center justify-center p-6">
        <Minesweeper />
      </main>
    </div>
  );
}
