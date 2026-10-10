import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React 15/16-era components in this repo still rely on the classic JSX
// transform (`import React from 'react'` in scope). Switch to the automatic
// runtime once React is upgraded in a later phase.
export default defineConfig({
  plugins: [react({ jsxRuntime: 'classic' })]
});
