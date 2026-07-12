import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import NexusPreset from './theme/nexus-preset'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: NexusPreset,
    options: {
      // Always-on dark scheme — Coffee Bean is the app background
      darkModeSelector: '.app-dark',
    },
  },
})

app.mount('#app')
