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
    path: '/spotify',
    name: 'spotify',
    component: () => import('@routes/spotify/SpotifyView.vue'),
    meta: handleMeta(true, true, 'Spotify'),
  },
  {
    path: '/spotify/search',
    name: 'spotify-search',
    component: () => import('@routes/spotify/SpotifySearchView.vue'),
    meta: handleMeta(true, true, 'Search'),
  },
  {
    path: '/spotify/library',
    name: 'spotify-library',
    component: () => import('@routes/spotify/SpotifyLibraryView.vue'),
    meta: handleMeta(true, true, 'Library'),
  },
  {
    path: '/spotify/stats',
    name: 'spotify-stats',
    component: () => import('@routes/spotify/SpotifyStatsView.vue'),
    meta: handleMeta(true, true, 'Spotify Stats'),
  },
  {
    path: '/spotify/artists/:artistId',
    name: 'spotify-artist',
    component: () => import('@routes/spotify/SpotifyArtistView.vue'),
    meta: handleMeta(true, true, 'Artist'),
  },
  {
    path: '/spotify/albums/:albumId',
    name: 'spotify-album',
    component: () => import('@routes/spotify/SpotifyAlbumView.vue'),
    meta: handleMeta(true, true, 'Album'),
  },
  {
    path: '/spotify/playlists/:playlistId',
    name: 'spotify-playlist',
    component: () => import('@routes/spotify/SpotifyPlaylistView.vue'),
    meta: handleMeta(true, true, 'Playlist'),
  },
  {
    path: '/github',
    name: 'github',
    component: () => import('@routes/github/GithubView.vue'),
    meta: handleMeta(true, true, 'GitHub'),
  },
  {
    path: '/github/search',
    name: 'github-search',
    component: () => import('@routes/github/GithubSearchView.vue'),
    meta: handleMeta(true, true, 'Search'),
  },
  {
    path: '/github/pulls',
    name: 'github-pulls',
    component: () => import('@routes/github/GithubPullsView.vue'),
    meta: handleMeta(true, true, 'Pull requests'),
  },
  {
    path: '/github/stats',
    name: 'github-stats',
    component: () => import('@routes/github/GithubStatsView.vue'),
    meta: handleMeta(true, true, 'GitHub Stats'),
  },
  {
    path: '/github/:owner/:repo',
    name: 'github-repo',
    component: () => import('@routes/github/GithubRepoView.vue'),
    meta: handleMeta(true, true, 'Repository'),
  },
  {
    path: '/github/:owner/:repo/pulls/new',
    name: 'github-pull-create',
    component: () => import('@routes/github/GithubPullCreateView.vue'),
    meta: handleMeta(true, true, 'New pull request'),
  },
  {
    path: '/github/:owner/:repo/pulls/:number',
    name: 'github-pull-detail',
    component: () => import('@routes/github/GithubPullDetailView.vue'),
    meta: handleMeta(true, true, 'Pull request'),
  },
  {
    path: '/sports',
    redirect: '/sports/football',
  },
  {
    path: '/sports/:sport(football|tennis|rugby|golf|darts|field-hockey)',
    name: 'sports-sport',
    component: () => import('@routes/sports/SportView.vue'),
    meta: handleMeta(true, true, 'Sports'),
  },
  {
    path: '/f1',
    name: 'f1',
    component: () => import('@routes/f1/F1View.vue'),
    meta: handleMeta(true, true, 'Formula 1'),
  },
  {
    path: '/f1/meetings/:meetingKey',
    name: 'f1-meeting',
    component: () => import('@routes/f1/F1MeetingView.vue'),
    meta: handleMeta(true, true, 'F1 Weekend'),
  },
  {
    path: '/f1/sessions/:sessionKey',
    name: 'f1-session',
    component: () => import('@routes/f1/F1SessionView.vue'),
    meta: handleMeta(true, true, 'F1 Session'),
  },
  {
    path: '/f1/sessions/:sessionKey/replay',
    name: 'f1-replay',
    component: () => import('@routes/f1/F1ReplayView.vue'),
    meta: handleMeta(true, true, 'F1 Replay'),
  },
  {
    path: '/profile',
    component: () => import('@routes/profile/ProfileLayoutView.vue'),
    meta: handleMeta(true, true, 'Profile'),
    children: [
      {
        path: '',
        name: 'profile',
        component: () => import('@routes/profile/ProfileDetailsView.vue'),
        meta: handleMeta(true, true, 'Profile'),
      },
      {
        path: 'sessions',
        name: 'profile-sessions',
        component: () => import('@routes/profile/ProfileSessionsView.vue'),
        meta: handleMeta(true, true, 'Sessions'),
      },
    ],
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

/** `vite build --watch` rewrites hashed chunks; tab may still point at an old file. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed') ||
    message.includes('error loading dynamically imported module')
  )
}

router.onError((error, to) => {
  if (!isChunkLoadError(error)) return

  const key = 'nexus:chunk-reload'
  const last = sessionStorage.getItem(key)
  const now = String(Date.now())
  // Avoid a reload loop if the asset is genuinely missing.
  if (last && Date.now() - Number(last) < 10_000) return
  sessionStorage.setItem(key, now)
  window.location.assign(to.fullPath)
})

export default router
