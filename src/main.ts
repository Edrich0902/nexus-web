import { createApp } from 'vue'
import { PiniaColada } from '@pinia/colada'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'
import Ripple from 'primevue/ripple'

import './style.css'
import App from './App.vue'
import NexusPreset from './theme/nexus-preset'
import { pinia } from '@stores/pinia.store'
import { useAuthStore } from '@stores/auth/auth.store'
import { setUnauthorizedHandler } from '@lib/http'
import router from './router'

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
  if (router.currentRoute.value.name !== 'login') {
    void router.replace({ name: 'login' })
  }
})

app.use(router)
app.mount('#app')
