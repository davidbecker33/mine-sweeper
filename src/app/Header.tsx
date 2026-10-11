import { ChevronDownIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useGame } from '../games/minesweeper/context';
import { gameActions } from '../games/minesweeper/actions';

export default function Header() {
  const { dispatch } = useGame();

  return (
    <header className="border-b border-border bg-card pt-[env(safe-area-inset-top)]">
      {/* The bar itself stays full-bleed; only its content is bounded, so
          brand/menu don't end up far apart on an ultra-wide monitor. */}
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-2">
        <span className="text-lg font-semibold">MineSweeper</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              Game
              <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => dispatch(gameActions.createNewGame())}>New game</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
