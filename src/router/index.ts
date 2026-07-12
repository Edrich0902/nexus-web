import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth/auth.store'

declare module 'vue-router' {
  interface RouteMeta {
    showMenu: boolean
    authed: boolean
    guest?: boolean
    title: string
  }
}

const handleMeta = (
  showMenu: boolean,
  authed: boolean,
  title: string,
  guest = false,
) => ({
  showMenu,
  authed,
  guest,
  title,
})

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@routes/auth/LoginView.vue'),
    meta: handleMeta(false, false, 'Login', true),
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@routes/home/HomeView.vue'),
    meta: handleMeta(true, true, 'Home'),
  },
  {
    path: '/',
    redirect: { name: 'home' },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'home' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const baseTitle = 'Nexus Hub'
  document.title = to.meta.title ? `${baseTitle} | ${to.meta.title}` : baseTitle

  if (to.meta.authed && !auth.authed) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guest && auth.authed) {
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : null
    if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
      return redirect
    }
    return { name: 'home' }
  }
})

export default router
