import { resolve } from 'path'
import { cpSync, mkdirSync } from 'fs'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

function copyMigrationsPlugin() {
  return {
    name: 'copy-migrations',
    closeBundle() {
      const dest = resolve('out/main/migrations')
      mkdirSync(dest, { recursive: true })
      cpSync(resolve('electron/db/migrations'), dest, { recursive: true })
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyMigrationsPlugin()],
    build: {
      lib: {
        entry: resolve('electron/main.ts')
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: { index: resolve('electron/preload.ts') }
      }
    },
    resolve: {
      alias: {
        '@shared': resolve('shared')
      }
    }
  },
  renderer: {
    root: 'src',
    build: {
      rollupOptions: {
        input: {
          index: resolve('src/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve('src'),
        '@shared': resolve('shared')
      }
    },
    plugins: [react()]
  }
})
