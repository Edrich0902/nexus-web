import { createApp } from 'vue'
import { PiniaColada } from '@pinia/colada'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Ripple from 'primevue/ripple'

import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/instrument-serif/latin-400.css'
import '@fontsource/instrument-serif/latin-400-italic.css'
import '@fontsource/bricolage-grotesque/latin-600.css'
import '@fontsource/bricolage-grotesque/latin-800.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import './style.css'
import App from './App.vue'
import NexusPreset from './theme/nexus-preset'
import { pinia } from '@stores/pinia.store'
import { useAuthStore } from '@stores/auth/auth.store'
import { setSessionRefreshHandler, setUnauthorizedHandler } from '@lib/http'
import { initAutoHideScrollbars } from '@lib/scrollbar'
import router from './router'

initAutoHideScrollbars()

const app = createApp(App)

app.use(PrimeVue, {
  ripple: true,
  theme: {
    preset: NexusPreset,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)
app.directive('tooltip', Tooltip)
app.directive('ripple', Ripple)

app.use(pinia)
app.use(PiniaColada)

const authStore = useAuthStore()
await authStore.initialise()

setUnauthorizedHandler(() => {
  authStore.clearSession()
  const current = router.currentRoute.value
  if (current.name !== 'login') {
    void router.replace({
      name: 'login',
      query: { reason: 'expired', redirect: current.fullPath },
    })
  }
})

setSessionRefreshHandler(() => authStore.refresh())

app.use(router)
app.mount('#app')
