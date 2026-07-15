/// <reference types="vitest/config" />

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { sourcemap: false, target: 'es2022' },
  test: { exclude: ['tests/browser/**', 'node_modules/**', 'dist/**'] },
})
