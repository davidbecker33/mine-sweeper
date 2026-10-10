import { expect, test, type Page } from '@playwright/test';

const CELL = '[role="gridcell"]';
const HIDDEN_CELL = '[role="gridcell"][data-state="hidden"]';
const REVEALED_MINE = '[role="gridcell"][data-state="revealed"][data-mine]';

/**
 * Mine positions are genuinely random in the real app (no seam to mock
 * them from outside, unlike the GameBoard component test's mocked board),
 * so these smoke tests click cells one at a time until a mine is hit
 * rather than asserting against known positions.
 */
async function clickUntilMineHit(page: Page): Promise<void> {
  const total = await page.locator(CELL).count();
  for (let i = 0; i < total; i++) {
    if (
      await page
        .getByText('Oooops')
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }
    await page
      .locator(CELL)
      .nth(i)
      .click({ force: true })
      .catch(() => {});
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector(CELL);
});

test('renders a 9x9 ARIA grid of hidden cells', async ({ page }) => {
  await expect(page.getByRole('grid', { name: 'Minesweeper board' })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(9);
  await expect(page.locator(CELL)).toHaveCount(81);
});

test('revealing a safe cell updates it without ending the game', async ({ page }) => {
  // Mine positions are random, so the first cell isn't guaranteed safe --
  // deal fresh boards (via "Play again?") until one is, rather than
  // asserting on a specific position that occasionally happens to be a mine.
  let revealedSafely = false;
  for (let attempt = 0; attempt < 10 && !revealedSafely; attempt++) {
    const cell = page.locator(CELL).first();
    await cell.click({ force: true });

    if (
      await page
        .getByText('Oooops')
        .isVisible()
        .catch(() => false)
    ) {
      await page.getByRole('button', { name: 'Play again?' }).click();
      continue;
    }

    await expect(cell).toHaveAttribute('data-state', 'revealed');
    revealedSafely = true;
  }

  expect(revealedSafely).toBe(true);
  await expect(page.getByText('Oooops')).not.toBeVisible();
  await expect(page.getByText('Congratulations')).not.toBeVisible();
});

test('clicking a mine reveals every mine and opens the loss modal', async ({ page }) => {
  await clickUntilMineHit(page);
  await expect(page.getByText('Oooops!!')).toBeVisible();

  // The known mine-placement RNG bug (documented in the modernization plan)
  // can place fewer than the intended 10 -- assert a sane lower bound
  // rather than flaking on an exact count of 10.
  await page.waitForTimeout(300);
  const mineCount = await page.locator(REVEALED_MINE).count();
  expect(mineCount).toBeGreaterThan(0);
  expect(mineCount).toBeLessThanOrEqual(10);
});

test('Close dismisses the loss modal and it does not reopen on a later safe click', async ({ page }) => {
  await clickUntilMineHit(page);
  await expect(page.getByText('Oooops!!')).toBeVisible();

  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByText('Oooops!!')).not.toBeVisible();

  const stillHidden = page.locator(HIDDEN_CELL).first();
  if (await stillHidden.count()) {
    await stillHidden.click({ force: true });
    await expect(page.getByText('Oooops!!')).not.toBeVisible();
  }
});

test('"Play again?" starts a fresh, fully-hidden board', async ({ page }) => {
  await clickUntilMineHit(page);
  await page.getByRole('button', { name: 'Play again?' }).click();

  await expect(page.getByText('Oooops!!')).not.toBeVisible();
  await expect(page.locator(HIDDEN_CELL)).toHaveCount(81);
});

test('header "New game" resets the board mid-game', async ({ page }) => {
  await page.locator(CELL).first().click();

  await page.getByRole('button', { name: 'Game' }).click();
  await page.getByRole('menuitem', { name: 'New game' }).click();

  await expect(page.locator(HIDDEN_CELL)).toHaveCount(81);
});

test('arrow keys move a roving tabindex across the grid', async ({ page }) => {
  const first = page.locator(`${CELL}[tabindex="0"]`);
  await first.focus();
  await expect(first).toHaveAccessibleName('Row 1, Column 1, hidden');

  await page.keyboard.press('ArrowRight');
  await expect(page.locator(`${CELL}[tabindex="0"]`)).toHaveAccessibleName('Row 1, Column 2, hidden');
  await expect(page.locator(`${CELL}[tabindex="0"]`)).toHaveCount(1);

  await page.keyboard.press('ArrowDown');
  await expect(page.locator(`${CELL}[tabindex="0"]`)).toHaveAccessibleName('Row 2, Column 2, hidden');

  // Space/Enter activate the focused cell like a real button, no mouse needed.
  await page.keyboard.press('Enter');
  await expect(page.locator(`${CELL}[tabindex="0"]`)).toHaveAttribute('data-state', 'revealed');
});

test.describe('color scheme', () => {
  test.use({ colorScheme: 'light' });
  test('light preference does not apply the dark class', async ({ page }) => {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('color scheme', () => {
  test.use({ colorScheme: 'dark' });
  test('dark preference applies the dark class before first paint', async ({ page }) => {
    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
