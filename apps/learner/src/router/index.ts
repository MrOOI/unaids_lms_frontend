import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { isAdminRole, isSysAdminRole, canViewReporting } from '../lib/api-types'

// Auth views (bare layout, no nav shell)
const RegisterView = () => import('../views/auth/RegisterView.vue')
const LoginView = () => import('../views/auth/LoginView.vue')
const VerifyOtpView = () => import('../views/auth/VerifyOtpView.vue')
const ForgotPasswordView = () => import('../views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('../views/auth/ResetPasswordView.vue')

// Learner views (app layout)
const DashboardView = () => import('../views/DashboardView.vue')
const CourseDetailView = () => import('../views/CourseDetailView.vue')
const CourseFeedbackView = () => import('../views/CourseFeedbackView.vue')
const LessonView = () => import('../views/LessonView.vue')
const QuizView = () => import('../views/QuizView.vue')
const CertificatesView = () => import('../views/CertificatesView.vue')
const ProfileView = () => import('../views/ProfileView.vue')

// Public (bare layout)
const CertificateVerifyView = () => import('../views/CertificateVerifyView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')
const ForbiddenView = () => import('../views/ForbiddenView.vue')

// Admin views (admin layout)
const AdminCoursesView = () => import('../views/admin/AdminCoursesView.vue')
const AdminCourseDetailView = () => import('../views/admin/AdminCourseDetailView.vue')
const AdminLessonDetailView = () => import('../views/admin/AdminLessonDetailView.vue')
const AdminModuleQuizzesView = () => import('../views/admin/AdminModuleQuizzesView.vue')
const AdminQuizDetailView = () => import('../views/admin/AdminQuizDetailView.vue')
const AdminReportingView = () => import('../views/admin/AdminReportingView.vue')
const AdminCertificatesView = () => import('../views/admin/AdminCertificatesView.vue')
const AdminAuditLogView = () => import('../views/admin/AdminAuditLogView.vue')

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    layout?: 'app' | 'admin' | 'bare'
    requiresRole?: 'admin' | 'observer' | 'sysadmin'
  }
}

export const routes: RouteRecordRaw[] = [
  // ============== AUTH (public, bare layout) ==============
  {
    path: '/auth/register',
    name: 'register',
    component: RegisterView,
    meta: { title: 'Create Account', requiresAuth: false, layout: 'bare' },
  },
  {
    path: '/auth/login',
    name: 'login',
    component: LoginView,
    meta: { title: 'Sign In', requiresAuth: false, layout: 'bare' },
  },
  {
    path: '/auth/verify-otp/:email',
    name: 'verify-otp',
    component: VerifyOtpView,
    meta: { title: 'Verify Email', requiresAuth: false, layout: 'bare' },
    props: true,
  },
  {
    path: '/auth/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: { title: 'Reset Password', requiresAuth: false, layout: 'bare' },
  },
  {
    path: '/auth/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: { title: 'Reset Password', requiresAuth: false, layout: 'bare' },
  },

  // ============== PUBLIC ==============
  {
    path: '/certificates/verify',
    name: 'certificate-verify',
    component: CertificateVerifyView,
    meta: { title: 'Verify Certificate', requiresAuth: false, layout: 'bare' },
  },
  {
    path: '/403',
    name: 'forbidden',
    component: ForbiddenView,
    meta: { title: 'Access denied', requiresAuth: false, layout: 'bare' },
  },

  // ============== LEARNER (protected, app layout) ==============
  {
    path: '/',
    name: 'home',
    component: DashboardView,
    meta: { title: 'Dashboard', requiresAuth: true, layout: 'app' },
  },
  {
    path: '/courses/:slug',
    name: 'course-detail',
    component: CourseDetailView,
    meta: { title: 'Course', requiresAuth: true, layout: 'app' },
    props: true,
  },
  {
    path: '/courses/:slug/feedback',
    name: 'course-feedback',
    component: CourseFeedbackView,
    meta: { title: 'Course Feedback', requiresAuth: true, layout: 'app' },
    props: true,
  },
  {
    path: '/courses/:slug/lessons/:lessonId',
    name: 'lesson',
    component: LessonView,
    meta: { title: 'Lesson', requiresAuth: true, layout: 'app' },
    props: true,
  },
  {
    path: '/quizzes/:quizId',
    name: 'quiz',
    component: QuizView,
    meta: { title: 'Quiz', requiresAuth: true, layout: 'app' },
    props: true,
  },
  {
    path: '/certificates',
    name: 'certificates',
    component: CertificatesView,
    meta: { title: 'Certificates', requiresAuth: true, layout: 'app' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfileView,
    meta: { title: 'Profile', requiresAuth: true, layout: 'app' },
  },

  // ============== ADMIN (protected, admin layout, CourseAdmin/SysAdmin) ==============
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: AdminCoursesView,
    meta: { title: 'Course Administration', requiresAuth: true, layout: 'admin', requiresRole: 'admin' },
  },
  {
    path: '/admin/courses/:courseId',
    name: 'admin-course-detail',
    component: AdminCourseDetailView,
    meta: { title: 'Course', requiresAuth: true, layout: 'admin', requiresRole: 'admin' },
    props: true,
  },
  {
    path: '/admin/lessons/:lessonId',
    name: 'admin-lesson-detail',
    component: AdminLessonDetailView,
    meta: { title: 'Lesson content', requiresAuth: true, layout: 'admin', requiresRole: 'admin' },
    props: true,
  },
  {
    path: '/admin/modules/:moduleId/quizzes',
    name: 'admin-module-quizzes',
    component: AdminModuleQuizzesView,
    meta: { title: 'Quizzes', requiresAuth: true, layout: 'admin', requiresRole: 'admin' },
    props: true,
  },
  {
    path: '/admin/quizzes/:quizId',
    name: 'admin-quiz-detail',
    component: AdminQuizDetailView,
    meta: { title: 'Quiz', requiresAuth: true, layout: 'admin', requiresRole: 'admin' },
    props: true,
  },
  {
    path: '/admin/reporting',
    name: 'admin-reporting',
    component: AdminReportingView,
    meta: { title: 'Reporting', requiresAuth: true, layout: 'admin', requiresRole: 'observer' },
  },
  {
    path: '/admin/certificates',
    name: 'admin-certificates',
    component: AdminCertificatesView,
    // CertificatesController.RevokeCertificate is [Authorize(Roles = SysAdmin)] only.
    meta: { title: 'Certificates', requiresAuth: true, layout: 'admin', requiresRole: 'sysadmin' },
  },
  {
    path: '/admin/audit-log',
    name: 'admin-audit-log',
    component: AdminAuditLogView,
    // AdminAuditLogController is [Authorize(Roles = SysAdmin)] only.
    meta: { title: 'Audit Log', requiresAuth: true, layout: 'admin', requiresRole: 'sysadmin' },
  },

  // ============== FALLBACK ==============
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: 'Not found', requiresAuth: false, layout: 'bare' },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, savedPosition) => savedPosition || { top: 0 },
})

// Routes an already-authenticated visitor shouldn't land on — they'd just
// bounce back to their dashboard.
const AUTH_ONLY_ROUTE_NAMES = new Set(['login', 'register', 'verify-otp'])

router.beforeEach(async (to, _from, next) => {
  const { user, isAuthenticated, isReady, fetchMe } = useAuth()

  document.title = `${to.meta.title || 'Page'} — UNAIDS LMS`

  // Resolve the session exactly once per app load, regardless of which route
  // is hit first. Without this, landing directly on a public route (e.g. a
  // bookmarked /auth/login) never probed the session, so an already-logged-in
  // visitor saw the login form instead of being redirected to their dashboard.
  if (!isReady.value) {
    await fetchMe()
  }

  if (to.meta.requiresAuth === false) {
    if (isAuthenticated.value && AUTH_ONLY_ROUTE_NAMES.has(to.name as string)) {
      next({ name: 'home' })
      return
    }
    next()
    return
  }

  if (!isAuthenticated.value) {
    next({ name: 'login', query: { from: to.fullPath } })
    return
  }

  if (to.meta.requiresRole === 'sysadmin' && !isSysAdminRole(user.value?.roles)) {
    next({ name: 'forbidden' })
    return
  }

  if (to.meta.requiresRole === 'admin' && !isAdminRole(user.value?.roles)) {
    next({ name: 'forbidden' })
    return
  }

  if (to.meta.requiresRole === 'observer' && !canViewReporting(user.value?.roles)) {
    next({ name: 'forbidden' })
    return
  }

  next()
})

export default router
