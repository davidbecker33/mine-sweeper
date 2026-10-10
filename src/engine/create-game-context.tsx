import { createContext, useContext, useReducer, type Dispatch, type ReactNode, type Reducer } from 'react';

export interface GameContextValue<State, Action> {
  state: State;
  dispatch: Dispatch<Action>;
}

/**
 * Wraps a (state, action) => state reducer in a Context + Provider + hook,
 * the same boilerplate every reducer-driven game in this template needs.
 * Game-specific state/action/reducer types live with the game itself
 * (games/<game>/types.ts, reducer.ts) -- this factory only owns the wiring.
 */
export function createGameContext<State, Action>(reducer: Reducer<State, Action>, initialState: State) {
  const GameContext = createContext<GameContextValue<State, Action> | undefined>(undefined);

  function GameProvider({ children }: { children: ReactNode }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
  }

  function useGame(): GameContextValue<State, Action> {
    const context = useContext(GameContext);
    if (context === undefined) {
      throw new Error('useGame must be used within its GameProvider');
    }
    return context;
  }

  return { GameContext, GameProvider, useGame };
}
