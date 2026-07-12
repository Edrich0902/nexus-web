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
  '@views': path.resolve(rootDir, 'src/views'),
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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'development') {
    return {
      plugins,
      appType: 'spa',
      build: {
        outDir: './dist/dev',
        sourcemap: true,
        target: 'esnext',
      },
      resolve: {
        alias: aliases,
      },
    }
  }

  if (mode === 'staging') {
    return {
      plugins,
      appType: 'spa',
      build: {
        outDir: './dist/stage',
        sourcemap: false,
        target: 'esnext',
      },
      resolve: {
        alias: aliases,
      },
    }
  }

  if (mode === 'production') {
    return {
      plugins,
      appType: 'spa',
      build: {
        outDir: './dist/prod',
        sourcemap: false,
        target: 'esnext',
      },
      resolve: {
        alias: aliases,
      },
    }
  }

  return {
    mode,
    plugins,
    appType: 'spa',
    build: {
      outDir: './dist/dev',
      sourcemap: true,
      target: 'esnext',
    },
    resolve: {
      alias: aliases,
    },
  }
})
