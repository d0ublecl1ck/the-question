import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { defineConfig, configDefaults } from 'vitest/config'
import { DEFAULT_DEV_BASE_URL } from './src/lib/apiBaseUrl'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const backendUrl =
    process.env.VITE_BACKEND_URL ?? (isProd ? '' : DEFAULT_DEV_BASE_URL)

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/setupTests.ts',
      exclude: [...configDefaults.exclude, '**/.worktrees/**', '**/worktrees/**'],
    },
  }
})
