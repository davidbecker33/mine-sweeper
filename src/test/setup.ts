import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Explicit rather than relying on Testing Library's auto-detected global
// afterEach -- this project uses `globals: false` (explicit `import {
// describe, it, expect } from 'vitest'` in every test file) rather than
// Vitest's global test API, so that auto-detection never fires.
afterEach(() => {
  cleanup();
});
