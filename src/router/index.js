import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/DeviceListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/device/:id',
      name: 'device',
      component: () => import('../views/DeviceDetailView.vue'),
      meta: { requiresAuth: true },
      props: true
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // Wait for firebase auth to init if needed
  await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      resolve()
      unsubscribe()
    })
  })

  if (requiresAuth && !auth.currentUser) {
    next('/login')
  } else if (to.path === '/login' && auth.currentUser) {
    next('/')
  } else {
    next()
  }
})

export default router
