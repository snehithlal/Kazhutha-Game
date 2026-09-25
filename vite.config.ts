import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Relative assets work at /, /REPOSITORY/, and with custom Pages domains.
  base: './',
  test: { include: ['src/**/*.test.ts'], environment: 'node' },
});
