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
   - `engine/class-names.ts` — the old `rjs-directives.js`'s `rjsClass`, renamed `classNames`. Converting it to TypeScript forced a real fix: every call site already passes evaluated booleans, never strings, so `eval()` was doing nothing except tripping the bundler's eval warning and failing to typecheck (`eval` wants a `string`, callers pass `boolean`) — removed.
   - `games/minesweeper/types.ts` — `Cell`, `MinesweeperBoard`, `GameStatus`, `GameState`. These are *not* in `engine/` despite the plan above: `GameStatus`'s values are this game's own vocabulary (`'new' | 'success' | 'failed'`, matching the reducer's actual current output), and a future game will have its own status shape, not this one.
   - `games/minesweeper/{logic,actions,reducer}.ts`, `games/minesweeper/components/*.tsx`, `app/{App,Header,Footer}.tsx`.
   - Deleted outright rather than converted: `about.js`, `nomatch.js`, `layout.js` (all unreachable once Phase 2 removed the router — `layout.js` additionally imported two files that never existed), and `store/store.js` (`configureStore` was never called anywhere; `index.jsx` always built its own store directly).
3. Type component props explicitly (no more implicit `any` from `this.props.whatever`). This surfaced two real, pre-existing bugs, both fixed as a condition of the code typechecking at all rather than deferred:
   - `processMineBlockAction` discards blocks when `nodes.length === 0` via a bare `return;` instead of `return gameBlocks;` — `undefined` can't satisfy a `MinesweeperBoard` return type, and the caller spreads the result (`[...processBlockAction(...)]`), so this was a `TypeError: undefined is not iterable` waiting to happen on a specific flood-fill shape, not just a style nit.
   - `actions.ts` exported action-type string constants (`CREATE_NEW_GAME`, etc.) and action-creator functions off the *same* object; `bindActionCreators` won't accept that shape (its type requires every property to be a function), and the switch in `reducer.ts` couldn't narrow on non-`const` string cases either. Split into `GameActionType` (an `as const` object of literals) and `gameActions` (just the creators) — both problems were really one typing issue.

`Difficulty` (board size / mine count presets) is deferred to whichever phase actually implements difficulty levels, rather than added now with no code using it — same reasoning for not adding a `flagged` field to `Cell` ahead of a flagging feature actually existing.

## Phase 4 — State management: Redux → hooks + Context

The existing reducer is already a pure function of `(state, action) => newState` — that's exactly the shape `useReducer` wants, so this migration is mostly *deletion*, not rewriting game logic.

**Recommendation:** `useReducer` + React Context for the global game state, no new state library required.

```
engine/
  game-context.tsx   # createContext + Provider wrapping useReducer(gameReducer, initialState)
  use-game.ts         # custom hook: const { state, dispatch } = useGame()
games/minesweeper/
  reducer.ts          # same action shape, ported to TS, with the processGameState bug fixed
```

- `store/store.js` and the `redux`/`react-redux`/`redux-thunk` packages are deleted entirely.
- `connect(mapStateToProps, mapDispatchToProps)` wrappers in `board.js` and `header.js` are replaced by `const { state, dispatch } = useGame()` inside the component — fewer layers, no boilerplate action-binding.
- Action creators stay as plain functions returning `{ type, payload }`, now typed as a discriminated union (`type GameAction = { type: 'CREATE_NEW_GAME'; payload: { difficulty: Difficulty } } | ...`) so the reducer's `switch` is exhaustively checked by `tsc`.

**When to reach for something heavier than Context:** if a future game in this template needs frequent high-frequency updates (e.g., a physics-driven game re-rendering 60x/sec) where Context's "every consumer re-renders" behavior becomes a bottleneck, add **Zustand** at that point — it's a ~1KB hook-based store with selector-based subscriptions, and it fits the "hooks, not Redux" direction the same way. Don't add it preemptively; Minesweeper's update frequency (user clicks) doesn't need it.

## Phase 5 — Component & coding-standard modernization

1. **Class components → function components + hooks** across the board (`Minesweeper`, `GameBoard`, `Block`, `Header`, `Footer`, `App`).
2. **Lifecycle → hooks mapping**, concretely for this codebase:
   - `GameBoard.componentWillMount` → `useEffect(() => dispatch(createNewGame()), [])`.
   - `GameBoard.componentWillReceiveProps` (watching `isMineStruck`/`gameState` to open the modal) → derive `showModal` directly from `state.status` instead of mirroring it into local component state at all; this removes an entire class of "stale prop vs state" bugs.
   - `Counter`'s manual `TimerMixin.setInterval`/`clearInterval` bookkeeping → a small `useCountdown(seconds)` hook in `engine/` using `useEffect` + `useRef` for the interval handle. Delete `react-timer-mixin`.
3. **Fix the unstable list keys** in the board render — use the existing stable `cell.key` (or `${x}-${y}`) instead of `index + yIndex++`.
4. **Optionally swap `engine/class-names.ts`'s hand-rolled `classNames()` for `clsx`** — the `eval()` hazard this item originally targeted was already removed in Phase 3 (the helper never needed `eval` in the first place; see its implementation note), so this is just a minor ergonomics upgrade (variadic args, array/conditional shorthand) rather than a fix.
5. **Accessibility**: the board is a grid of clickable `div`s with no keyboard access or ARIA semantics today. Model it on the [ARIA grid pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — `role="grid"`/`role="row"`/`role="gridcell"`, arrow-key navigation, `aria-label` per cell (e.g. "Row 3, Column 4, hidden" / "revealed, 2 adjacent mines"), and real `<button>` elements instead of `div onClick` so screen readers and keyboard-only users can actually play.
6. **Performance**: wrap `Block`/`Cell` in `React.memo` once props are properly typed, so a single cell reveal doesn't re-render all 81+ cells. Memoize derived board-wide computations (e.g. win-check) with `useMemo`.
7. **Linting/formatting**: add ESLint (flat config, `eslint-plugin-react-hooks`, `@typescript-eslint`) + Prettier, and fix the real bug flagged in Phase 0 (`processGameState(state.blocks)` using stale state) as part of this pass rather than carrying it forward typed.
8. **Testing**: add **Vitest** + **React Testing Library** for unit/component tests (flood-fill correctness, win/loss detection, rendering), since there is currently zero test coverage. Add **Playwright** for one or two end-to-end smoke flows (new game → reveal → win/lose modal) — this becomes the regression safety net Phase 0 lacked.

## Phase 6 — Styling: Bootstrap → Tailwind

**Note:** `react-bootstrap` and the `bootstrap` devDependency were already removed in Phase 2 (they crashed under React 19 — see the implementation note there), and replaced with plain markup against `public/styles/bootstrap.min.css` as a bridge. That CSS file — confirmed to actually be Bootstrap 3, not 4 — and the bridge markup in `header.jsx`/`board.jsx` are what this phase replaces.

1. Remove `styles/bootstrap.min.css` and the hand-rolled Bootstrap-3-classed markup from `header.jsx`/`board.jsx`.
2. Add **Tailwind CSS v4** (CSS-first config via `@theme`, no separate `tailwind.config.js` needed for simple cases) + its Vite plugin.
3. Rebuild the modal using an accessible headless primitive rather than hand-rolling focus-trap/ESC-to-close logic: **Radix UI Dialog** (or `shadcn/ui`, which is Radix + Tailwind pre-wired — a good fit since you're already moving to Tailwind, and its components are copied into your repo rather than installed as an opaque dependency, which suits a template).
4. Port `styles/styles.css`'s game-specific rules (`.board`, `.active`/`.inactive`, `.mine`, `.prox-1/2/3`) to Tailwind utility classes or a small `@layer components` block; keep mine-count color coding (classic Minesweeper UX: 1=blue, 2=green, 3=red, etc.) as Tailwind classes driven by the typed `adjacentMines` value instead of the current manual `prox-1`/`prox-2`/`prox-3` enumeration (extend it to cover 4–8, which the current CSS doesn't).
5. Add a dark-mode variant (`dark:` classes) — cheap to get now while rebuilding styles, and expected on mobile/PWA installs.

## Phase 7 — Gameplay packages: better foundations for 2D games

The current board is plain DOM/CSS-grid, which is actually the *right* choice for a tile-based game like Minesweeper (accessible, simple, cheap). Keep that approach for Minesweeper itself. But since this repo is meant as a **template for other 2D games**, add a few packages at the `engine/` level that the next game can lean on without forcing Minesweeper to use them:

- **`motion`** (the renamed Framer Motion) — tile reveal/flip animations, modal transitions, mine-explosion feedback. Declarative, hooks-based, fits the rest of the stack.
- **`use-sound`** (thin wrapper over Howler.js) — click/reveal/win/lose sound effects; trivial to add and meaningfully improves game feel.
- **`zustand`** — see Phase 4, held in reserve for a future game that needs it.
- **`immer`** (optional) — if any future game's reducer needs deep nested-state updates, `useReducer` + `immer`'s `produce` keeps update logic readable without hand-written spreads. Not needed for Minesweeper's current state shape.
- For a *future* game that needs true canvas/sprite rendering (particle effects, free-form movement, physics) rather than a discrete grid: evaluate **`react-konva`** (simpler API, 2D-canvas-shape-oriented, easiest mental model coming from DOM) or **`pixi.js` + `@pixi/react`** (faster, WebGL-backed, more game-engine-like) at that time. Don't add either now — Minesweeper has no use for canvas rendering, and pulling in a canvas engine "just in case" adds bundle weight and complexity to every game in the template, including this one.

## Phase 8 — Make it installable: PWA

This gets the "install it on a phone" requirement with the least complexity, and works for Minesweeper as-is since it's already a fully client-side app.

1. Add **`vite-plugin-pwa`**: generates a web app manifest + service worker (precaching the built assets) with almost no hand-written config.
2. Add a real manifest: app name, icons (multiple sizes incl. maskable for Android adaptive icons), theme color, `display: "standalone"`.
3. Verify "Add to Home Screen" works on both iOS Safari and Android Chrome, and that the app launches full-screen without browser chrome.
4. Run a Lighthouse PWA audit as an acceptance check for this phase.

At this point the game is installable from the browser on any phone with zero app-store review process — worth shipping and using for a while before deciding whether true native packaging (Phase 9) is actually needed.

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
