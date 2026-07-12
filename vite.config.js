import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'
import tailwindcss from '@tailwindcss/vite'

const aliases = {
  '@': path.resolve(__dirname, 'src'),
  '@views': path.resolve(__dirname, 'src/views'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@stores': path.resolve(__dirname, 'src/stores'),
  '@assets': path.resolve(__dirname, 'src/assets'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@lib': path.resolve(__dirname, 'src/lib'),
}

const plugins = [
  vue(),
  vueDevTools(),
  tailwindcss(),
  Components({
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
