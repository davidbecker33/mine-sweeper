# Manual Regression Baseline

There is no automated test coverage yet (added in Phase 5 of
[modernization-plan.md](modernization-plan.md)). Until then, run through this
checklist after each phase to confirm nothing broke. Run it once now, on the
pre-migration behavior, so later runs have something to compare against.

## Setup

```bash
npm install
npm start      # Vite dev server (was: webpack-dev-server on port 8080)
```

Open the app in a browser.

## Checklist

1. **Initial render** — a 9×9 grid of blank (hidden) cells renders under the
   "MineSweeper" header. No cells are revealed yet.
2. **Reveal an empty cell** — clicking a cell with no adjacent mines reveals
   it and flood-fills all connected zero-count neighbors, stopping at cells
   that border a mine (shown with their mine-adjacency count, color-coded for
   1–3).
3. **Reveal a numbered cell** — clicking a cell adjacent to at least one mine
   reveals only that cell, showing its count; no flood-fill.
4. **Hit a mine** — clicking a mine reveals *all* mines on the board and pops
   the "Oooops!! You accidentally clicked on a mine." modal.
5. **"Play again?" after a loss** — clicking the link in the loss modal
   closes the modal and deals a fresh board (previous reveals are cleared).
6. **Win condition** — reveal every non-mine cell without hitting a mine; the
   "Congratulations!!! You successfully avoided all mines." modal appears.
7. **"Play again?" after a win** — same as (5), from the win modal.
8. **Header "New game" menu** — the "Game" dropdown in the header → "New
   game" resets the board at any point, win/loss/in-progress.
9. **Already-revealed cells are inert** — clicking a previously revealed
   cell does nothing (no re-processing, no errors in the console).
10. **No console errors** — open devtools during the above; the current code
    should be clean of runtime errors (warnings about deprecated APIs are
    expected pre-migration and not a regression signal).

## Known pre-existing issues (not regressions if still present)

These are tracked in [modernization-plan.md](modernization-plan.md) and are
expected to persist until the phase that addresses them:

- Mine count isn't always exactly 10 (RNG in `generateRandomMineNodes` can
  produce duplicate indices, silently placing fewer mines).
- Keyboard-only and screen-reader users cannot play (no ARIA grid semantics,
  no focus/keyboard handling) — addressed in Phase 5.
- No difficulty levels; board is a hardcoded 9×9 with 10 mines — addressed
  alongside the `Difficulty` type in Phase 3.
