import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Local-only overrides: when src/data/<name>.private.ts exists (gitignored), imports of
 * src/data/<name> resolve to it, so the local site keeps personal plan/skill data while
 * the public build (GitHub Pages) uses the committed, generic files.
 */
const privateData = (): Plugin => ({
  name: 'private-data',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer || !/\/data\/(plan|skillmap|lessons)$/.test(source)) return null
    const file = resolve(dirname(importer), `${source}.private.ts`)
    return existsSync(file) ? file : null
  },
})

export default defineConfig({
  base: './',
  plugins: [privateData(), react()],
  resolve: { dedupe: ['react', 'react-dom'] },
})
