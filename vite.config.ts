import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

const aliases = {
  '@': path.resolve(rootDir, 'src'),
  '@routes': path.resolve(rootDir, 'src/routes'),
  '@components': path.resolve(rootDir, 'src/components'),
  '@stores': path.resolve(rootDir, 'src/stores'),
  '@assets': path.resolve(rootDir, 'src/assets'),
  '@services': path.resolve(rootDir, 'src/services'),
  '@lib': path.resolve(rootDir, 'src/lib'),
}

const plugins = [
  vue(),
  vueDevTools(),
  tailwindcss(),
  Components({
    dts: 'src/components.d.ts',
    resolvers: [PrimeVueResolver()],
  }),
]

function buildConfig(outDir: string, sourcemap: boolean) {
  return {
    outDir,
    sourcemap,
    target: 'esnext' as const,
    // Vite 8: codeSplitting replaces deprecated manualChunks.
    // Never group all of primevue together — that regenerates a ~575 kB chunk.
    // Components stay on automatic splits with the lazy routes that import them.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vue-vendor',
              test: /node_modules[\\/](vue|vue-router|pinia|@pinia)([\\/]|$)/,
              priority: 30,
            },
            {
              name: 'axios',
              test: /node_modules[\\/]axios([\\/]|$)/,
              priority: 20,
            },
            {
              name: 'prime-theme',
              test: /node_modules[\\/](@primeuix|@primevue|primeicons)([\\/]|$)/,
              maxSize: 200_000,
              priority: 15,
            },
            {
              name: 'primevue-core',
              test: /node_modules[\\/]primevue[\\/](config|toastservice|confirmationservice|tooltip|ripple|usetoast|useconfirm|usedialog|api|basedirective|basecomponent|base)([\\/.]|$)/,
              priority: 10,
            },
          ],
        },
      },
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    return {
      plugins,
      appType: 'spa',
      build: buildConfig('./dist/dev', true),
      resolve: {
        alias: aliases,
      },
    }
  }

  if (mode === 'staging') {
    return {
      plugins,
      appType: 'spa',
      build: buildConfig('./dist/stage', false),
      resolve: {
        alias: aliases,
      },
    }
  }

  if (mode === 'production') {
    return {
      plugins,
      appType: 'spa',
      build: buildConfig('./dist/prod', false),
      resolve: {
        alias: aliases,
      },
    }
  }

  return {
    mode,
    plugins,
    appType: 'spa',
    build: buildConfig('./dist/dev', true),
    resolve: {
      alias: aliases,
    },
  }
})
