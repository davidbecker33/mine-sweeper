# Minesweeper Modernization Plan

**Status:** Draft for review
**Branch:** `upgrade-mine-sweeper`
**Goal:** Bring this project from React 15 / Redux / Babel / Webpack 1 / Bootstrap up to a modern, typed, hook-based stack that is also a solid *template* for building other 2D board/tile games — and that can be installed on a phone (PWA) or packaged for the App Store / Google Play.

## Current state (for reference)

- **Build:** Webpack 1 + `webpack-dev-server`, Babel 6 (`es2015`, `react`, `stage-2` presets), no TypeScript.
- **UI:** React 15 class components, `react-bootstrap` 0.32 (Bootstrap 4) for layout/modal, a custom `rjsClass()` helper that builds `className` strings using `eval()`.
- **State:** Redux 4 + `react-redux` 5, a single reducer (`reducer.js`) driving `blocks`, `score`, `isMineStruck`, `gameState`. Logic (flood-fill, mine placement, win check) lives in `util/board-utils.js` and is already pure/functional — good bones to carry forward.
- **Routing:** `react-router-dom` 4, but only a single `"/"` route is registered — effectively unused.
- **i18n:** `react-intl` is wired into `.babelrc` but not actually used in any component.
- **Misc:** `lodash` is imported everywhere but used lightly (`_.forEach`, `_.remove`); `react-timer-mixin` powers the countdown `Counter` component using a legacy mixin pattern.
- **Board:** hardcoded 9×9 grid, 10 mines, no difficulty levels.

A few pre-existing bugs/smells worth fixing opportunistically during the rewrite (not blocking, but good to track):
- `reducer.js` `PROCESS_CLICK` computes `processGameState(state.blocks)` from the *pre-mutation* blocks instead of the newly computed ones — likely an off-by-one-update bug.
- `rjsClass()` uses `eval()` on object values — unnecessary and a minor security smell; trivially replaced by `clsx`/`classnames`.
- Mine placement (`generateRandomMineNodes`) uses `Math.floor(Math.random() * blockCount - 1) + 1`, which skews distribution and doesn't guarantee the requested mine count (duplicates are just dropped).
- React keys in `board.js` (`key={index + yIndex++}`) are not stable across re-renders.
- No keyboard/ARIA support on the board — not screen-reader or keyboard-navigable.

---

## Guiding principle for "template-ability"

Since this repo is meant to become a template for other 2D games, structure the rewrite so **generic engine code** and **Minesweeper-specific code** are physically separated from day one:

```
src/
  engine/        # grid/board primitives, generic types, timer/hooks, reusable UI shell
  games/
    minesweeper/  # everything specific to this game
  app/           # routing, layout, providers
```

Anything written in Phases 3–7 below should default to living in `engine/` unless it's genuinely Minesweeper-specific (mine placement, cell rendering). That's what makes the *next* game cheap to build.

---

## Phase 0 — Safety net

1. Confirm work happens on `upgrade-mine-sweeper` (already true); keep `master` untouched until ready to merge.
2. Write down current behavior as a short manual test script (new game, click reveal, flood-fill, click mine → loss modal, clear board → win modal, "New game" menu item) — there's no automated test coverage today, so this is the regression baseline until Phase 5 adds real tests.
3. Bump `engines.node` off of `5.5.0` to an actively-supported Node LTS (20 or 22) — nothing in later phases will run on Node 5.

## Phase 1 — Tooling foundation: replace Webpack

**Recommendation: migrate off Webpack 1 to [Vite](https://vite.dev/).**

Why, specifically for a 2D-game template:
- Native ESM dev server — instant startup and HMR regardless of project size, which matters once you're adding sprite/animation libraries.
- First-class TypeScript support with zero Babel config (uses esbuild/Rolldown under the hood).
- `vite-plugin-pwa` gives installable/offline support almost for free (Phase 8).
- One config file replaces `webpack.config.js` + `.babelrc` + `react-hot-loader` entirely.

Alternatives considered: Next.js (overkill — this is a client-only game, SSR buys nothing and complicates static/App Store packaging), Parcel (fine, but weaker PWA/Capacitor ecosystem docs than Vite), CRA (deprecated by the React team — do not use).

Steps:
1. `npm create vite@latest` scaffold (React + TypeScript template) or hand-roll `vite.config.ts` + move `index.html` to project root (Vite convention) pointing at `/src/main.tsx`.
2. Delete `webpack.config.js`, `.babelrc`, `server.js`, all `babel-*` packages, `react-hot-loader`.
3. Replace `npm start` with `vite` (dev), add `vite build` and `vite preview` scripts.
4. Move `styles/` assets under `src/assets` or `public/` per Vite conventions; `styles/images/mine.png` becomes an imported asset (enables cache-busting + tree-shaking of unused images later).

## Phase 2 — Dependency upgrades

Upgrade/replace in `package.json` (major-version targets; grab latest patch within each at install time):

| Current | Action |
|---|---|
| `react` 15, `react-dom` 15 | → **React 19** / `react-dom` 19 |
| `react-redux` 5, `redux` 4, `redux-thunk` | **remove** (see Phase 4) |
| `react-router` 4, `react-router-dom` 4 | **remove**, or if the template wants multi-screen support (settings/leaderboard pages for future games), add **React Router 7** fresh — don't carry the v4 API forward |
| `react-bootstrap`, `bootstrap` | **remove** (see Phase 6) |
| `react-intl` | **remove** unless i18n is an actual near-term requirement; if kept, upgrade to the current `react-intl`/FormatJS line and actually wire it up |
| `react-timer-mixin` | **remove** — replaced by a plain `useEffect` interval hook |
| `lodash` | **remove** — the two call sites (`_.forEach`, `_.remove`) are one-liners in native JS/TS; dropping it removes a legacy CJS dependency from a bundle that should stay lean on mobile |
| `babel-*`, `core-js`, `babel-polyfill` | **remove** entirely — not needed once Vite/TS own the build, and modern browsers (incl. the WebViews Capacitor uses) don't need `core-js` polyfills for this app's feature set |
| `async`, `coveralls`, `properties-parser` | **remove** — unused/dead devDependencies |

New additions are listed per-phase below rather than dumped here, so each one is tied to a concrete reason.

**Implementation note (what actually happened):** `react-bootstrap@0.32` turned out to hard-crash under React 19 — it uses the legacy `childContextTypes` API (removed in React 19) and string refs internally, which threw inside `<Navbar>` with no way to opt out. Upgrading it to the current major (`react-bootstrap@2.x`, Bootstrap 5-based) would have meant redoing the same markup again in Phase 6, so instead `react-bootstrap` and `bootstrap` were dropped here rather than deferred. The two usages (`<Navbar>`/`<NavDropdown>` in `header.jsx`, `<Modal>` in `board.jsx`) were replaced with plain markup against the *existing* CSS classes as a bridge to Phase 6. Along the way this also surfaced a pre-existing, unrelated bug: `public/styles/bootstrap.min.css` is actually **Bootstrap 3** (`.in`/`.navbar-default`/`.open > .dropdown-menu` conventions), despite `package.json` having declared `bootstrap: ^4.1.0` — it happened to work before only because `react-bootstrap@0.32` itself renders Bootstrap 3 markup. The replacement markup targets Bootstrap 3 classes to match the file that's actually being served. Phase 6 replaces all of this CSS and markup wholesale, so this is intentionally throwaway scaffolding, not a long-term investment.

`react-router`/`react-router-dom` were removed outright rather than upgraded to v7 — the app only ever registered a single `"/"` route wrapping `<App>`, so the router wasn't doing anything functional. `index.jsx` now renders `<App />` directly. If a future game in this template needs multiple screens, add React Router (or an equivalent) fresh at that point rather than carrying the v4→v7 migration of unused code.

`redux-thunk` was dropped as dead weight — it was a declared dependency but never actually wired into `applyMiddleware` (the store was created as plain `createStore(gameReducer, initialState)`), so there was nothing to migrate. `react-intl` was dropped the same way — declared but never imported anywhere in `src/`.

## Phase 3 — TypeScript migration + shared type models

Replace Babel with TypeScript directly (Vite compiles `.ts`/`.tsx` natively; run `tsc --noEmit` in CI for type-checking since Vite's build doesn't type-check by default).

1. Add `tsconfig.json` with `"strict": true` from the start — this codebase is small enough to go strict immediately rather than loosening and tightening later. (`noUncheckedIndexedAccess` was deliberately left off: the grid-access code indexes `board[x][y]` pervasively behind bounds checks the compiler can't see through, and turning it on would mean sprinkling non-null assertions everywhere for little real benefit on a codebase this size — worth reconsidering once `logic.ts` has real tests backing it.)
2. Physically split the tree along the `engine/` vs `games/minesweeper/` line described above, converting to `.ts`/`.tsx` as part of the same move rather than as a second pass:
   - `engine/types.ts` — only the genuinely generic pieces: `Position`, `Board<T>`.
   - `engine/grid.ts` — `getNeighbors<T extends Position>()`, generalized from the old `adjacentNodes` (was only ever called internally, so the rename was free).
   - `engine/class-names.ts` — the old `rjs-directives.js`'s `rjsClass`, renamed `classNames`. Converting it to TypeScript forced a real fix: every call site already passes evaluated booleans, never strings, so `eval()` was doing nothing except tripping the bundler's eval warning and failing to typecheck (`eval` wants a `string`, callers pass `boolean`) — removed. Since superseded by `engine/cn.ts` (see the Phase 3 follow-up note below) — `clsx`/`tailwind-merge` is the pattern already in use on the author's other projects, so there was no reason to keep the hand-rolled version around until Phase 5.
   - `games/minesweeper/types.ts` — `Cell`, `MinesweeperBoard`, `GameStatus`, `GameState`. These are *not* in `engine/` despite the plan above: `GameStatus`'s values are this game's own vocabulary (`'new' | 'success' | 'failed'`, matching the reducer's actual current output), and a future game will have its own status shape, not this one.
   - `games/minesweeper/{logic,actions,reducer}.ts`, `games/minesweeper/components/*.tsx`, `app/{App,Header,Footer}.tsx`.
   - Deleted outright rather than converted: `about.js`, `nomatch.js`, `layout.js` (all unreachable once Phase 2 removed the router — `layout.js` additionally imported two files that never existed), and `store/store.js` (`configureStore` was never called anywhere; `index.jsx` always built its own store directly).
3. Type component props explicitly (no more implicit `any` from `this.props.whatever`). This surfaced two real, pre-existing bugs, both fixed as a condition of the code typechecking at all rather than deferred:
   - `processMineBlockAction` discards blocks when `nodes.length === 0` via a bare `return;` instead of `return gameBlocks;` — `undefined` can't satisfy a `MinesweeperBoard` return type, and the caller spreads the result (`[...processBlockAction(...)]`), so this was a `TypeError: undefined is not iterable` waiting to happen on a specific flood-fill shape, not just a style nit.
   - `actions.ts` exported action-type string constants (`CREATE_NEW_GAME`, etc.) and action-creator functions off the *same* object; `bindActionCreators` won't accept that shape (its type requires every property to be a function), and the switch in `reducer.ts` couldn't narrow on non-`const` string cases either. Split into `GameActionType` (an `as const` object of literals) and `gameActions` (just the creators) — both problems were really one typing issue.

`Difficulty` (board size / mine count presets) is deferred to whichever phase actually implements difficulty levels, rather than added now with no code using it — same reasoning for not adding a `flagged` field to `Cell` ahead of a flagging feature actually existing.

**Follow-up:** `engine/class-names.ts` was replaced by `engine/cn.ts` shortly after this phase landed — `cn(...inputs) = twMerge(clsx(inputs))`, matching the pattern already used on the author's other projects (`clsx` + `tailwind-merge`), pulled forward rather than left as the Phase 5 "optional" item below. `tailwind-merge` has nothing to merge until Phase 6 adds Tailwind classes, but the dependency is harmless to carry early and saves a second migration of the same call sites later.

## Phase 4 — State management: Redux → hooks + Context

The existing reducer is already a pure function of `(state, action) => newState` — that's exactly the shape `useReducer` wants, so this migration is mostly *deletion*, not rewriting game logic.

**Recommendation:** `useReducer` + React Context for the global game state, no new state library required.

**Implementation note (what actually happened):** Same spirit, slightly different split — consistent with how `engine/` vs `games/minesweeper/` was divided in Phase 3, the *generic* Context-wiring boilerplate (`createContext` + `Provider` + `useReducer` + a `useGame()` hook) went in `engine/create-game-context.tsx` as a factory, `createGameContext<State, Action>(reducer, initialState)`, so the next game in the template gets the same plumbing for free instead of copy-pasting it. The Minesweeper-specific instantiation (`createGameContext<GameState, GameAction>(gameReducer, initialState)`) lives in `games/minesweeper/context.ts`. `reducer.ts`'s `initialState` (an empty-board placeholder — `GameBoard` immediately dispatches `CREATE_NEW_GAME` on mount, which is what actually generates the real board) is exported and reused as both the reducer's default parameter and the Provider's seed state, rather than duplicated.

- `store/store.js` and the `redux`/`react-redux` packages are deleted entirely (`redux-thunk` was already dropped in Phase 2 — see its implementation note).
- `connect(mapStateToProps, mapDispatchToProps)` wrappers in `GameBoard.tsx`/`Header.tsx` are gone. Both are still **class** components at this point (the class → function/hooks conversion is Phase 5's job, not this one), so they consume the context via `static contextType = GameContext` rather than the `useGame()` hook — `useGame()` exists now for Phase 5 to switch to later, with zero changes needed to the Context layer itself when that happens.
- The `GameAction` discriminated union (`type GameAction = ReturnType<typeof gameActions.createNewGame> | ...`) was already introduced in Phase 3 to fix `bindActionCreators`'/the reducer `switch`'s typing — nothing further needed here.

**A real pitfall hit along the way, worth flagging for the next game built on this pattern:** `GameBoard`'s old `componentWillReceiveProps(nextProps)` (open the modal when `isMineStruck || gameState === 'success'`) doesn't have a context equivalent — there's no "component receives new context" lifecycle for class components. The naive port to `componentDidUpdate()` running the same check **infinite-loops**: `componentDidUpdate` fires after *any* re-render, including ones from the component's own `setState` (`open()`/`close()`), so `open()` calling `setState` triggers another `componentDidUpdate`, which calls `open()` again, forever. The fix is to gate on whether `this.context.state` actually changed *by reference* (the reducer always returns a new object per dispatch, same as Redux did), not on the field values themselves — that distinguishes "a real dispatch happened" from "local UI state changed," which is exactly what `componentWillReceiveProps` was doing implicitly via its coupling to `connect()`'s prop diffing. See the comment on `GameBoard`'s `lastState` field for the full reasoning; this pattern (or its function-component/`useEffect` equivalent) will recur for any future game needing "react once to a state transition, not a UI-triggered re-render" semantics.

**When to reach for something heavier than Context:** if a future game in this template needs frequent high-frequency updates (e.g., a physics-driven game re-rendering 60x/sec) where Context's "every consumer re-renders" behavior becomes a bottleneck, add **Zustand** at that point — it's a ~1KB hook-based store with selector-based subscriptions, and it fits the "hooks, not Redux" direction the same way. Don't add it preemptively; Minesweeper's update frequency (user clicks) doesn't need it.

## Phase 5 — Component & coding-standard modernization

1. **Class components → function components + hooks** across the board (`Minesweeper`, `GameBoard`, `Block`, `Header`, `Footer`, `App`).
2. **Lifecycle → hooks mapping**, concretely for this codebase:
   - `GameBoard.componentWillMount` → `useEffect(() => dispatch(createNewGame()), [])`.
   - `GameBoard.componentWillReceiveProps` (watching `isMineStruck`/`gameState` to open the modal) → derive `showModal` directly from `state.status` instead of mirroring it into local component state at all; this removes an entire class of "stale prop vs state" bugs.
   - `Counter`'s manual `setInterval`/`clearInterval` bookkeeping (already de-mixin'd in Phase 2) → a small `useCountdown(seconds)` hook in `engine/` using `useEffect` + `useRef` for the interval handle.
3. **Fix the unstable list keys** in the board render — use the existing stable `cell.key` (or `${x}-${y}`) instead of `index + yIndex++`.
4. **Accessibility**: the board is a grid of clickable `div`s with no keyboard access or ARIA semantics today. Model it on the [ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — `role="grid"`/`role="row"`/`role="gridcell"`, arrow-key navigation, `aria-label` per cell (e.g. "Row 3, Column 4, hidden" / "revealed, 2 adjacent mines"), and real `<button>` elements instead of `div onClick` so screen readers and keyboard-only users can actually play.
5. **Performance**: wrap `Block`/`Cell` in `React.memo` once props are properly typed, so a single cell reveal doesn't re-render all 81+ cells. Memoize derived board-wide computations (e.g. win-check) with `useMemo`.
6. **Linting/formatting**: add ESLint (flat config, `eslint-plugin-react-hooks`, `@typescript-eslint`) + Prettier, and fix the real bug flagged in Phase 0 (`processGameState(state.blocks)` using stale state) as part of this pass rather than carrying it forward typed.
7. **Testing**: add **Vitest** + **React Testing Library** for unit/component tests (flood-fill correctness, win/loss detection, rendering), since there is currently zero test coverage. Add **Playwright** for one or two end-to-end smoke flows (new game → reveal → win/lose modal) — this becomes the regression safety net Phase 0 lacked.

**Implementation notes (what actually happened):**

- **The Phase 0 bug description was imprecise.** `processGameState(state.blocks)` isn't reading *stale* data — `processBlockAction` mutates cells in place and JS evaluates object-literal properties top-to-bottom, so by the time that line ran it already saw the post-mutation board. The actual bug is simpler: the ternary forced `gameState` to `'failed'` on *any* non-winning click (`processGameState` only answers "has the player won" — `false` means "keep playing," not "lost"). Fixed in `reducer.ts`'s `PROCESS_CLICK` case by preserving `state.gameState` instead of defaulting to `'failed'`.
- **`showModal` ended up more thoroughly derived than originally sketched.** The first pass used local `useState` + a `useEffect` watching `[isMineStruck, gameState]` — a faithful hooks port of the old `componentWillReceiveProps` check. ESLint's `react-hooks/set-state-in-effect` rule flagged it, and chasing that properly (rather than suppressing the rule) led somewhere better: dismissal now lives in the reducer itself as `dismissedFor: GameStatus | null` (reset to `null` on `CREATE_NEW_GAME`, set via a new `DISMISS_RESULT` action), making `showModal = (isMineStruck || gameState === 'success') && dismissedFor !== gameState` a pure derived expression with **no local state and no effect at all**. This also fixed a latent bug the effect-based version had: a `GameBoard`-local "dismissed" flag can never be reset by Header's "New game," since they're sibling components — moving dismissal into the shared reducer state fixes that for free.
- **One intentional behavior change**, flagged here since it wasn't asked for but follows from the above: previously, dismissing the loss/win modal and then clicking *any other cell* popped it back open — purely an accident of how Redux's `connect()` prop-diffing worked (described in the Phase 4 note), never a designed feature. With `dismissedFor`, closing the modal keeps it closed until the *next distinct* result (a later win after a dismissed loss still correctly reopens it, since `dismissedFor` only matches the result it was recorded against).
- **A real React.memo + mutation bug, caught by hand before it shipped:** wrapping `Block` in `React.memo` only pays off if `processBlockAction`/`processMineBlockAction` hand back *new* cell objects for whatever changed — they used to mutate `cell.visited` in place, which meant the memoized `Block` never saw a prop reference change and silently stopped updating. Symptom: clicks appeared to do nothing (verified first that the click handler *was* firing and dispatching correctly, which pointed at the render layer rather than the event layer). Fixed with a small `reveal()` helper in `logic.ts` that replaces `gameBlocks[x][y]` with a new object instead of mutating the existing one. Now a regression test (`logic.test.ts`, "replaces revealed cell objects by reference...") pins this down directly.
- **Keeping `Block`'s callback props (`onActivate`/`onNavigate`/`registerRef`) stable** (via `useCallback`) is what makes `React.memo` actually work — a new closure per cell per render would defeat it regardless of the mutation fix. Verified concretely, not just assumed: a `MutationObserver`-based check confirmed a single non-flood-fill click only mutated the DOM for the cells that actually changed (4 of 81 for a small flood-filled region), not the whole board.
- **ARIA grid roles needed a CSS adjustment, not just a markup one.** `role="row"` wrapper `<div>`s between `.board` and the cells would have broken the existing float-based layout (which assumed cells were direct children of `.board`); fixed with `.board-row { display: contents; }`, which removes the wrapper from the box tree (preserving the float layout) while keeping it in the accessibility tree (preserving `role="row"`). Separately, `.board` itself turned out to collapse to `height: 0` — floated children never contributed to it, a pre-existing issue that simply had no visible consequence until `.board` became a `role="grid"` container something might reasonably check the geometry of. Fixed with `display: flow-root` on `.board` (a one-line modern clearfix).
- **`typescript` is pinned to `6.0.3`, not the newly-released `7.x`** — `typescript-eslint` doesn't support TypeScript 7 yet (peer range caps below `6.1.0`). Revisit this pin once the ecosystem catches up; forcing it now would mean an unverified lint setup.
- **Two ESLint findings worth calling out as reusable lessons** (both from `eslint-plugin-react-hooks`'s newer, stricter rules): mutating a `ref.current` directly during render (`react-hooks/refs`) is flagged even when it looks harmless — moved the one instance here out entirely by recognizing the board's dimensions never actually change at runtime, so a ref wasn't needed in the first place. And `react-hooks/set-state-in-effect` (above) — in both cases the lint rule pointed at a real design question, not a style nit.
- **Testing caught two more real-but-minor issues**, both in `GameBoard`'s modal, both already fixed above: it rendered *both* the win and loss messages into the DOM simultaneously (toggling visibility with a CSS `hidden` class rather than conditional rendering), and both messages contained an identically-labeled "Play again?" link — fine visually, but ambiguous to Testing Library (no stylesheet in jsdom) and arguably to screen readers too. Fixed by conditionally rendering only the applicable message. Relatedly, the modal's two "Close" controls (header ✕, footer button) both resolved to the accessible name "Close" — the header one is now labeled "Close dialog" for clarity in both the accessibility tree and the test queries.
- **Test suite layout**: `src/**/*.test.{ts,tsx}` (Vitest + React Testing Library, run via `npm test`) for the deterministic pure-logic and component-level coverage; `e2e/minesweeper.spec.ts` (Playwright, run via `npm run test:e2e`) for full-browser smoke flows (board renders, mine hit, dismiss/reopen semantics, "Play again?", header "New game," keyboard navigation) — this is the regression safety net `docs/manual-regression-baseline.md` called for back in Phase 0, now codified instead of run by hand.

## Phase 6 — Styling: Bootstrap → Tailwind

**Note:** `react-bootstrap` and the `bootstrap` devDependency were already removed in Phase 2 (they crashed under React 19 — see the implementation note there), and replaced with plain markup against `public/styles/bootstrap.min.css` as a bridge. That CSS file — confirmed to actually be Bootstrap 3, not 4 — and the bridge markup in `header.jsx`/`board.jsx` are what this phase replaces.

1. Remove `styles/bootstrap.min.css` and the hand-rolled Bootstrap-3-classed markup from `header.jsx`/`board.jsx`.
2. Add **Tailwind CSS v4** (CSS-first config via `@theme`, no separate `tailwind.config.js` needed for simple cases) + its Vite plugin.
3. Rebuild the modal using an accessible headless primitive rather than hand-rolling focus-trap/ESC-to-close logic: **Radix UI Dialog** (or `shadcn/ui`, which is Radix + Tailwind pre-wired — a good fit since you're already moving to Tailwind, and its components are copied into your repo rather than installed as an opaque dependency, which suits a template).
4. Port `styles/styles.css`'s game-specific rules (`.board`, `.active`/`.inactive`, `.mine`, `.prox-1/2/3`) to Tailwind utility classes or a small `@layer components` block; keep mine-count color coding (classic Minesweeper UX: 1=blue, 2=green, 3=red, etc.) as Tailwind classes driven by the typed `adjacentMines` value instead of the current manual `prox-1`/`prox-2`/`prox-3` enumeration (extend it to cover 4–8, which the current CSS doesn't).
5. Add a dark-mode variant (`dark:` classes) — cheap to get now while rebuilding styles, and expected on mobile/PWA installs.

**Implementation notes (what actually happened):**

- **shadcn/ui was scaffolded with the actual CLI** (`npx shadcn@latest init --template vite -b radix -p nova`), not hand-approximated — `-b radix` to get Radix primitives as planned (Base UI is now the CLI's own default; declined it to stay with what was actually discussed), `-p nova` for its Lucide/Geist preset. This wrote `components.json`, `src/components/ui/{button,dialog,dropdown-menu}.tsx`, and a full OKLCH-based token theme (`:root`/`.dark` CSS variables) into `src/styles/globals.css` — far more complete than hand-rolling would have produced, and it's the actual current shadcn output, not a guess at it.
- **shadcn's generated components import `cn` from a dedicated npm package now**, not a hand-rolled `lib/utils.ts` — a newer convention than the `clsx` + `tailwind-merge` pattern you asked to replicate from your other project back when `engine/cn.ts` was built. Repointed `components.json`'s `aliases.utils` to `@/engine/cn` and edited the three generated files' imports to match, then removed the `cn` package — one `engine/cn.ts` stays the single source of truth project-wide, including for every future `shadcn add`. (Each future `add` will likely re-generate the package import; it's a one-line fix per file, same as this time.)
- **The board is CSS Grid now, not floats.** `.board-row` wrapper `<div>`s (for `role="row"`) use Tailwind's `contents` utility (`display: contents`) so they stay in the accessibility tree without taking a box in the grid — the same technique Phase 5 used for the old float layout, just simpler now that there's no float/clearfix interaction to manage. Grid column width is computed via `calc(var(--spacing) * 8)` (Tailwind v4's actual spacing-scale variable) to match `Block`'s `size-8`, rather than hardcoding `2rem` in a second place.
- **Mine icon**: the old `mine.png` CSS-sprite background-image is gone (`public/styles/` deleted entirely) in favor of `lucide-react`'s `BombIcon` — resolution-independent, themeable via `text-destructive`, and `lucide-react` was already a dependency via shadcn's icon convention, so this didn't add a new one.
- **Mine-count color coding extended to the full 1–8 range** (a 9×9 board's cells can have up to 8 neighbors; the old CSS only defined 1–3) via a small `COUNT_COLOR` lookup in `Block.tsx`, each color with a `dark:` variant.
- **Dialog's own auto-generated close button was disabled** (`showCloseButton={false}`) — the exact same "two controls both named 'Close'" ambiguity from Phase 5's hand-rolled modal recurred here (shadcn's `DialogContent` renders its own ✕ button by default), and the explicit footer "Close" button already covers it; Esc and clicking outside still work regardless, both handled by Radix itself.
- **Dark mode**: implemented as "follow the OS/browser preference," not a manual toggle (not asked for). An inline script in `index.html`'s `<head>` — run before first paint to avoid a flash of the wrong theme — sets `.dark` on `<html>` from `matchMedia('(prefers-color-scheme: dark)')` and keeps it in sync via a `change` listener. Verified both directions with Playwright's `colorScheme` emulation, not just one.
- **`npm audit` flags 7 high-severity findings, all one root cause** (`braces`, a stack-exhaustion ReDoS) inside `shadcn`'s own dependency chain (`@shadcn/registry` → `fast-glob`/`ts-morph` → `micromatch` → `braces`) — a dev-only CLI tool invoked via `npx`, never bundled into the shipped app. `npm audit fix --force` would "fix" this by downgrading `shadcn` to `1.0.0`, which is not a real fix; left as-is and noted here rather than taken as an action item.
- **Testing needed real updates, not just selector touch-ups**, and one of them is worth internalizing for future UI work in this template: once Radix's `Dialog` is open, it marks the rest of the page `aria-hidden="true"` (correct modal-inerting behavior the old hand-rolled modal never had) — Testing Library's role queries respect that, so inspecting the board *through* an open dialog in `GameBoard.test.tsx` now needs `{ hidden: true }`. Playwright's own CSS/attribute locators (used throughout `e2e/minesweeper.spec.ts`) aren't affected by this, since they don't filter by accessibility-tree visibility the way `getByRole` does. Separately: Tailwind's utility classes aren't meaningful test selectors (there's no single `"active"`/`"inactive"`-type class anymore), so `Block` now sets `data-state="hidden" | "revealed"` and `data-mine` attributes — the same convention shadcn's own generated components use (`data-slot`, `data-variant`) — and both test suites query those instead of CSS classes. A genuine pre-existing flake also surfaced and got fixed along the way: an e2e test assumed the very first board cell was never a mine, which is false roughly 10/81 times at random; it now deals fresh boards via "Play again?" until it draws a safe one, instead of asserting on a position that occasionally isn't.

## Phase 7 — Gameplay packages: better foundations for 2D games

The current board is plain DOM/CSS-grid, which is actually the *right* choice for a tile-based game like Minesweeper (accessible, simple, cheap). Keep that approach for Minesweeper itself. But since this repo is meant as a **template for other 2D games**, add a few packages at the `engine/` level that the next game can lean on without forcing Minesweeper to use them:

- **`motion`** (the renamed Framer Motion) — tile reveal/flip animations, modal transitions, mine-explosion feedback. Declarative, hooks-based, fits the rest of the stack.
- **`use-sound`** (thin wrapper over Howler.js) — click/reveal/win/lose sound effects; trivial to add and meaningfully improves game feel.
- **`zustand`** — see Phase 4, held in reserve for a future game that needs it.
- **`immer`** (optional) — if any future game's reducer needs deep nested-state updates, `useReducer` + `immer`'s `produce` keeps update logic readable without hand-written spreads. Not needed for Minesweeper's current state shape.
- For a *future* game that needs true canvas/sprite rendering (particle effects, free-form movement, physics) rather than a discrete grid: evaluate **`react-konva`** (simpler API, 2D-canvas-shape-oriented, easiest mental model coming from DOM) or **`pixi.js` + `@pixi/react`** (faster, WebGL-backed, more game-engine-like) at that time. Don't add either now — Minesweeper has no use for canvas rendering, and pulling in a canvas engine "just in case" adds bundle weight and complexity to every game in the template, including this one.

**Implementation notes (what actually happened):**

- **`motion` and `use-sound` were actually wired into Minesweeper**, not just installed unused — "meaningfully improves game feel" only means something if a game in the template actually demonstrates it. `zustand`/`immer`/the canvas engines stayed exactly as documented above: evaluated and deliberately deferred, no code changes.
- **Tile reveal**: `Block` is now `motion.button` with `animate={block.visited ? { scale: [0.75, 1.08, 1] } : { scale: 1 }}` — a quick pop-in keyframe that fires once, right when a cell flips from hidden to revealed. This relies on the same `React.memo` guarantee Phase 5 established (`Block` only re-renders when its own `block`/`focused` props actually change), so the animation doesn't re-fire on unrelated re-renders of sibling cells.
- **Modal transitions needed nothing new** — shadcn's `Dialog` (Phase 6) already animates open/close via Tailwind's `data-open`/`data-closed` variants and `tw-animate-css`. The plan's "modal transitions" bullet was already satisfied before this phase started.
- **Mine-explosion feedback** is the same reveal-pop animation plus the existing `bg-destructive/15` + `BombIcon` treatment (Phase 6), now applied to every mine simultaneously when one is struck — read as a small "boom, revealed" moment without tracking which specific cell was clicked separately from the sweep. Deliberately kept simple: no distinct shake/particle effect on the one struck cell specifically, which would need extra state (which cell was "the" struck one, since `processMineBlockAction` reveals all of them) for a fairly minor visual nicety.
- **Sound assets**: `use-sound` needs real audio files, and there's no way to fetch or fabricate third-party audio in this environment — `reveal.wav`/`win.wav`/`lose.wav` in `games/minesweeper/sounds/` are synthesized from scratch (plain sine/triangle/square tones, written out as raw PCM) rather than sourced from anywhere, specifically so they're real, valid, audibly-confirmed files and not placeholder references to something that doesn't exist. Scoped under `games/minesweeper/` rather than `engine/`, since sound design is inherently game-specific — the next game picks its own.
- **Verifying "a sound actually played" took more than "no errors in the console."** Confirmed in three layers: the `.wav` files are actually fetched (network requests observed), no console/page errors occur around reveal/mine-hit, and — the one that actually proves playback, not just loading — instrumenting `AudioBufferSourceNode.prototype.start` showed new Web Audio nodes starting in direct response to both the reveal click and the mine hit.
- **`play()`'s reference stability was checked before relying on it**, not assumed: `use-sound`'s returned play function is itself `useCallback`-wrapped around `[sound, soundEnabled, interrupt]`, and `sound` is only recreated if the `src` argument changes (static imports here, so it never does) — meaning `playReveal` is safe to put in `handleActivate`'s dependency array without threatening the referential stability `Block`'s `React.memo` depends on (the exact failure mode Phase 5 hit once already with a different cause). `playWin`/`playLose` are triggered from `useEffect`s watching `[gameState]`/`[isMineStruck]`, the same "fires once per actual transition" pattern as the modal-dismissal logic from Phase 5/6, not a level check.

## Phase 8 — Make it installable: PWA

This gets the "install it on a phone" requirement with the least complexity, and works for Minesweeper as-is since it's already a fully client-side app.

1. Add **`vite-plugin-pwa`**: generates a web app manifest + service worker (precaching the built assets) with almost no hand-written config.
2. Add a real manifest: app name, icons (multiple sizes incl. maskable for Android adaptive icons), theme color, `display: "standalone"`.
3. Verify "Add to Home Screen" works on both iOS Safari and Android Chrome, and that the app launches full-screen without browser chrome.
4. Run a Lighthouse PWA audit as an acceptance check for this phase.

At this point the game is installable from the browser on any phone with zero app-store review process — worth shipping and using for a while before deciding whether true native packaging (Phase 9) is actually needed.

**Implementation notes (what actually happened):**

- **Icons were generated from scratch, not sourced.** Same constraint as Phase 7's sound effects: there's no way to fetch or fabricate a third-party logo/icon file in this environment. Rather than invent a placeholder reference, the app icon reuses the *exact* path data from `lucide-react`'s `Bomb` icon (already the in-game mine icon from Phase 6) on a background using the theme's own `--primary`/`--destructive` OKLCH values — so the home-screen icon and the in-game mine are visibly the same mark, not a mismatched placeholder. Built as plain SVG, then rasterized to exact pixel sizes (192, 512, 512-maskable, 180 for `apple-touch-icon`) via a headless-browser screenshot rather than a guessed/blurry scale-up, and visually reviewed at each size before committing.
- **The maskable icon is a real maskable icon, not a copy with a different name.** Android crops maskable icons into various shapes (circle, squircle, rounded square), so artwork needs to sit within an inner "safe zone" with the background extending to the full canvas edge (otherwise corners go transparent when masked). Built as a second SVG variant with the bomb scaled down and recentered within that safe zone, verified against a safe-zone guide circle before finalizing — not just the "any" icon resized.
- **`index.html` was missing `<meta charset>` and `<meta name="viewport">` entirely** — a gap in the original legacy markup nobody had reason to touch until now. Left alone, the game would render zoomed/broken on an actual phone, which is precisely what this phase is about, so it's fixed here rather than carried forward. Also added `<meta name="description">`, `apple-mobile-web-app-*` tags, and an explicit `<link rel="apple-touch-icon">` (belt-and-suspenders alongside `vite-plugin-pwa`'s own asset handling).
- **"Run a Lighthouse PWA audit" is no longer literally possible** — Lighthouse (checked at v13.5.0) has dropped the standalone "pwa" category entirely; Google moved installability checks into Chrome DevTools' own Application panel rather than a scored Lighthouse category. Substituted with the actual underlying mechanism: Chrome DevTools Protocol's `Page.getInstallabilityErrors`, queried directly via a Playwright CDP session against the production build (`vite preview`) — this is literally what Chrome itself evaluates before offering "Add to Home Screen" or an install prompt, so it's a more authoritative signal than the old Lighthouse score ever was. Result: zero installability errors, manifest parses with zero errors, service worker registers and reaches `active` state. Lighthouse's `accessibility` and `best-practices` categories were run anyway as a bonus check (not what the plan asked for, but free given the tooling was already in place) — these caught three real, fixable issues: a missing `lang` attribute, no `<main>` landmark (added in `App.tsx`), and a 404 on the browser's implicit `/favicon.ico` request (fixed with an explicit `<link rel="icon">` reusing the generated 192px icon). Both categories are 100/100 after fixes.
- **"Add to Home Screen" on real iOS Safari / Android Chrome hardware was not verified** — no physical devices or iOS/Android simulators are available in this environment. The verification that *is* possible and was done instead: the manifest is valid and served correctly, the service worker registers and activates, every icon URL resolves (200, not 404), and Chrome's own installability engine reports zero errors — which is the actual decision logic real Chrome-on-Android uses to decide whether to offer installation. iOS Safari's "Add to Home Screen" doesn't consult the manifest's installability signals the same way (it works directly off `apple-touch-icon`/`apple-mobile-web-app-*` meta tags, which are in place), but genuinely confirming the on-device experience — icon rendering, standalone launch with no Safari chrome — needs real hardware or a simulator this environment doesn't have.
- **Full gameplay was re-verified against the actual service-worker-enabled production build** (`vite preview`, not the dev server) — reveal, mine hit, modal, "Play again?" — specifically because a service worker sitting in front of the app is a new failure mode none of the earlier phases' testing exercised.

## Phase 9 — App Store / Google Play packaging (stretch goal)

If native-store presence is genuinely wanted (not just "installable"), the lowest-effort path from a React/Vite web app is **Capacitor**:

- Wraps the existing Vite build in a thin native shell per platform; you keep writing React/TypeScript, not native code.
- `npx cap init`, `npx cap add ios`, `npx cap add android`, then build the Vite output into each native project and ship through Xcode/Android Studio as normal.
- Gives access to native APIs later if wanted (haptics on mine-click, local notifications for daily-puzzle reminders) via Capacitor plugins, without a rewrite.

**Alternative (bigger investment, mention for completeness):** a full **React Native / Expo** rewrite would give a more "native-feel" UI and better performance ceiling for graphically heavier future games, but it means two parallel component trees (web template vs. native template) instead of one, and most of Phases 3–7 would need a second implementation. Given the stated goal — a *2D game template*, reused across many small games, installable on mobile — Capacitor's "one codebase, wrapped" model is the better fit. Revisit React Native only if a specific future game needs native-only capability (e.g. heavy use of native gesture/haptic APIs) that Capacitor can't bridge.

## Phase 10 — CI and ongoing quality gates

1. GitHub Actions workflow: `npm ci` → `tsc --noEmit` → `eslint` → `vitest run` → `vite build`, on every PR.
2. Add Playwright e2e job (from Phase 5) as a second CI job, possibly only on `main`/PRs to keep it fast.
3. Deploy preview builds (GitHub Pages, Netlify, or Vercel — any works for a static Vite output) so each PR is clickable/testable before merge, which matters more once this becomes a multi-game template others contribute to.

---

## Suggested phase ordering / dependencies

Phases 0–2 must happen first and in order (can't add TypeScript meaningfully on top of Webpack 1/Babel 6). After that:

- **3 (TypeScript) → 4 (state)** should happen before **5 (component modernization)** — it's much easier to convert a class component to hooks *and* add types in one pass than to do it twice.
- **6 (Tailwind)** is independent of 3–5 and can happen in parallel if more than one person is working on this.
- **7 (gameplay packages)** is additive and can slot in anytime after 4, as needed.
- **8 (PWA)** only needs 1–2 done (a working Vite build) — it does not depend on the TS/hooks/Tailwind work, so it could be pulled earlier if "installable on mobile" is the most urgent requirement.
- **9 (native packaging)** depends on 8.
- **10 (CI)** benefits from being set up right after Phase 3 (so type-checking is enforced from early on) rather than saved for the end.
