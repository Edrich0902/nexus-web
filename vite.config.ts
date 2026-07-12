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
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('/vue/') ||
            id.includes('/vue-router/') ||
            id.includes('/pinia/') ||
            id.includes('/@pinia/')
          ) {
            return 'vue-vendor'
          }
          if (
            id.includes('/primevue/') ||
            id.includes('/@primeuix/') ||
            id.includes('/@primevue/') ||
            id.includes('/primeicons/')
          ) {
            return 'primevue'
          }
          if (id.includes('/axios/')) {
            return 'axios'
          }
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
