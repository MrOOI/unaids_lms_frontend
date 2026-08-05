/**
 * TypeScript mirrors of the backend response/request DTOs.
 * Keep in sync with:
 *  - backend/src/Lms.Api/Contracts/AuthContracts.cs
 *  - backend/src/Lms.Application/Courses/CourseDtos.cs
 *  - backend/src/Lms.Application/Learning/ProgressDtos.cs
 *  - backend/src/Lms.Application/Assessment/QuizDtos.cs
 *  - backend/src/Lms.Application/Admin/AdminContracts.cs
 *  - backend/src/Lms.Application/Assessment/IQuizAdminService.cs
 *  - backend/src/Lms.Infrastructure/Services/{Certificate,Reporting}Service.cs
 *
 * ASP.NET Core serializes records with camelCase property names by default,
 * which is what's reflected below.
 */

// ---------- Auth ----------

export interface UserResponse {
  id: string
  email: string
  fullName: string
  preferredLocale: string
  roles: string[]
}

export interface RegisterRequest {
  email: string
  password: string
  fullName: string
  preferredLocale?: string | null
  region?: string | null
  district?: string | null
  organization?: string | null
  profession?: string | null
  consentAccepted: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

// ---------- Meta ----------

export interface ModuleThemeMeta {
  moduleNumber: number
  primary: string
  lightBackground: string
  meaning: string
}

export interface PlatformMeta {
  name: string
  version: string
  supportedLocales: string[]
  defaultLocale: string
  moduleThemes: ModuleThemeMeta[]
}

// ---------- Courses ----------

export interface CourseSummaryDto {
  id: string
  slug: string
  title: string
  description: string
  locale: string
  moduleCount: number
}

export interface LessonSummaryDto {
  id: string
  title: string
  sortOrder: number
  estimatedMinutes: number
}

export interface ModuleSummaryDto {
  id: string
  number: number
  themeNumber: number
  title: string
  summary: string
  lessons: LessonSummaryDto[]
}

export interface CourseDetailDto {
  id: string
  slug: string
  title: string
  description: string
  locale: string
  sequentialUnlock: boolean
  modules: ModuleSummaryDto[]
}

export type ContentBlockType =
  | 'RichText'
  | 'Image'
  | 'Video'
  | 'Audio'
  | 'FileAttachment'
  | 'ExternalLink'
  | 'KeyMessage'

export const CONTENT_BLOCK_TYPES: ContentBlockType[] = [
  'RichText',
  'Image',
  'Video',
  'Audio',
  'FileAttachment',
  'ExternalLink',
  'KeyMessage',
]

export interface ContentBlockDto {
  id: string
  type: ContentBlockType
  sortOrder: number
  payloadJson: string
}

export interface LessonDetailDto {
  id: string
  moduleId: string
  moduleNumber: number
  themeNumber: number
  title: string
  intro: string
  estimatedMinutes: number
  locale: string
  updatedAt: string
  blocks: ContentBlockDto[]
}

// ---------- Progress / enrollment ----------

export interface EnrollmentDto {
  courseId: string
  enrolledAt: string
  alreadyEnrolled: boolean
}

export type LessonProgressStatus = 'NotStarted' | 'InProgress' | 'Completed'

export interface LessonProgressDto {
  lessonId: string
  status: LessonProgressStatus
  completedAt: string | null
}

export interface CourseProgressDto {
  courseId: string
  totalLessons: number
  completedLessons: number
  percentComplete: number
  courseCompletedAt: string | null
  lessons: LessonProgressDto[]
  /** Highest module number currently reachable (§6.3 sequential unlock); null when not enforced — nothing is locked. */
  unlockedThroughModuleNumber: number | null
}

// ---------- Assessment ----------

export type QuizKind = 'Formative' | 'Final'

export interface QuizSummaryDto {
  id: string
  kind: QuizKind
  title: string
  description: string
  passScorePercent: number
  maxAttempts: number | null
  attemptsUsed: number
  hasPassed: boolean
}

export type QuestionType =
  | 'SingleChoice'
  | 'MultiChoice'
  | 'TrueFalse'
  | 'Matching'
  | 'Sequencing'
  | 'DragAndDrop'
  | 'Scenario'
  | 'Reflection'

export const QUESTION_TYPES: QuestionType[] = [
  'SingleChoice',
  'MultiChoice',
  'TrueFalse',
  'Matching',
  'Sequencing',
  'DragAndDrop',
  'Scenario',
  'Reflection',
]

export interface AttemptQuestionDto {
  id: string
  type: QuestionType
  points: number
  payloadJson: string
}

export type AttemptStatus = 'InProgress' | 'Submitted'

export interface AttemptDto {
  id: string
  quizId: string
  status: AttemptStatus
  startedAt: string
  questions: AttemptQuestionDto[]
}

export interface SubmitAnswerDto {
  questionId: string
  answerJson: string
}

export interface SubmitAttemptRequest {
  answers: SubmitAnswerDto[]
}

export interface AnswerResultDto {
  questionId: string
  isCorrect: boolean | null
  pointsAwarded: number
  feedback: string | null
}

export interface AttemptResultDto {
  attemptId: string
  scorePoints: number
  maxPoints: number
  scorePercent: number
  passed: boolean
  submittedAt: string
  answers: AnswerResultDto[]
}

export interface AttemptHistoryItemDto {
  attemptId: string
  status: AttemptStatus
  startedAt: string
  submittedAt: string | null
  scorePercent: number
  passed: boolean
}

// ---------- Certificates ----------

export interface CertificateVerificationResultDto {
  valid: boolean
  learnerName: string | null
  courseName: string | null
  issuedAt: string | null
}

export interface CertificateInfoDto {
  id: string
  certificateNumber: string
  verificationCode: string
  issuedAt: string
  isRevoked: boolean
}

/** A learner's own certificate — GET /certificates. */
export interface CertificateSummaryDto {
  id: string
  certificateNumber: string
  courseTitle: string
  verificationCode: string
  issuedAt: string
  isRevoked: boolean
}

/** Registry row for admins — GET /admin/certificates?search=. */
export interface CertificateAdminSummaryDto {
  id: string
  certificateNumber: string
  learnerName: string
  courseTitle: string
  courseLocale: string
  issuedAt: string
  isRevoked: boolean
  revocationReason: string | null
}

// ---------- Admin: catalog ----------

export interface CreateCourseRequest {
  slug: string
  sortOrder: number
}

export interface UpdateCourseRequest {
  slug?: string | null
  sortOrder?: number | null
  isPublished?: boolean | null
  sequentialUnlock?: boolean | null
}

export interface CourseTranslationRequest {
  title: string
  description: string
}

export interface ModuleRequest {
  number: number
  themeNumber: number
  sortOrder: number
  isPublished: boolean
}

export interface ModuleTranslationRequest {
  title: string
  summary: string
}

export interface LessonRequest {
  sortOrder: number
  estimatedMinutes: number
  isPublished: boolean
}

export interface LessonTranslationRequest {
  title: string
  intro: string
}

export interface ContentBlockRequest {
  type: ContentBlockType
  sortOrder: number
}

export interface BlockTranslationRequest {
  payloadJson: string
}

export interface AdminMutationResponse {
  id: string
}

// ---- Admin: read-side (drafts included, all locales) ----

export interface AdminCourseListItemDto {
  id: string
  slug: string
  isPublished: boolean
  sortOrder: number
  moduleCount: number
  translations: Record<string, CourseTranslationRequest>
}

export interface AdminLessonSummaryDto {
  id: string
  sortOrder: number
  estimatedMinutes: number
  isPublished: boolean
  translations: Record<string, LessonTranslationRequest>
}

export interface AdminModuleDto {
  id: string
  number: number
  themeNumber: number
  sortOrder: number
  isPublished: boolean
  translations: Record<string, ModuleTranslationRequest>
  lessons: AdminLessonSummaryDto[]
}

export interface AdminCourseDetailDto {
  id: string
  slug: string
  isPublished: boolean
  sortOrder: number
  sequentialUnlock: boolean
  translations: Record<string, CourseTranslationRequest>
  modules: AdminModuleDto[]
}

export interface AdminBlockDto {
  id: string
  type: ContentBlockType
  sortOrder: number
  payloadJsonByLocale: Record<string, string>
}

export interface AdminLessonDetailDto {
  id: string
  moduleId: string
  sortOrder: number
  estimatedMinutes: number
  isPublished: boolean
  translations: Record<string, LessonTranslationRequest>
  blocks: AdminBlockDto[]
}

// ---------- Admin: quiz ----------

export interface QuizRequest {
  kind: QuizKind
  passScorePercent: number
  maxAttempts: number | null
  questionCount: number | null
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  isPublished: boolean
  sortOrder: number
}

export interface QuizTranslationRequest {
  title: string
  description: string
}

export interface QuestionRequest {
  type: QuestionType
  points: number
  sortOrder: number
  isActive: boolean
  solutionJson: string
}

export interface QuestionTranslationRequest {
  payloadJson: string
}

// ---- Admin: quiz read-side ----

export interface AdminQuizListItemDto {
  id: string
  kind: QuizKind
  passScorePercent: number
  maxAttempts: number | null
  questionCount: number | null
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  isPublished: boolean
  sortOrder: number
  authoredQuestionCount: number
  translations: Record<string, QuizTranslationRequest>
}

export interface AdminQuestionDto {
  id: string
  type: QuestionType
  points: number
  sortOrder: number
  isActive: boolean
  solutionJson: string
  translations: Record<string, QuestionTranslationRequest>
}

export interface AdminQuizDetailDto {
  id: string
  courseModuleId: string
  kind: QuizKind
  passScorePercent: number
  maxAttempts: number | null
  questionCount: number | null
  shuffleQuestions: boolean
  shuffleAnswers: boolean
  isPublished: boolean
  sortOrder: number
  translations: Record<string, QuizTranslationRequest>
  questions: AdminQuestionDto[]
}

// ---------- Reporting ----------

export interface CourseMetricsDto {
  courseId: string
  courseName: string
  totalEnrolled: number
  completed: number
  completionPercent: number
  passedFinalQuiz: number
}

// ---------- Feedback ----------

export interface SubmitFeedbackRequest {
  registrationRating: number
  navigationRating: number
  contentQualityRating: number
  interactivityRating: number
  videoRating: number
  learningOutcomeRating: number
  satisfactionRating: number
  technicalIssuesText: string | null
  additionalComments: string | null
}

export interface FeedbackResponseDto {
  registrationRating: number
  navigationRating: number
  contentQualityRating: number
  interactivityRating: number
  videoRating: number
  learningOutcomeRating: number
  satisfactionRating: number
  technicalIssuesText: string | null
  additionalComments: string | null
  submittedAt: string
}

/** Aggregate-only (§15/§17) — no per-learner identity. */
export interface FeedbackSummaryDto {
  responseCount: number
  avgRegistrationRating: number
  avgNavigationRating: number
  avgContentQualityRating: number
  avgInteractivityRating: number
  avgVideoRating: number
  avgLearningOutcomeRating: number
  avgSatisfactionRating: number
  technicalIssueComments: string[]
  additionalComments: string[]
}

// ---------- Audit log ----------

export interface AuditLogEntryDto {
  id: string
  actorName: string
  action: string
  entityType: string
  entityId: string
  detailsJson: string
  createdAt: string
}

export interface AuditLogPageDto {
  entries: AuditLogEntryDto[]
  totalCount: number
  page: number
  pageSize: number
}

// ---------- Roles ----------

export const ROLE_LEARNER = 'Learner'
export const ROLE_COURSE_ADMIN = 'CourseAdmin'
export const ROLE_SYS_ADMIN = 'SysAdmin'
export const ROLE_OBSERVER = 'Observer'

export function isAdminRole(roles: string[] | undefined): boolean {
  return !!roles && (roles.includes(ROLE_COURSE_ADMIN) || roles.includes(ROLE_SYS_ADMIN))
}

export function canViewReporting(roles: string[] | undefined): boolean {
  return !!roles && (roles.includes(ROLE_SYS_ADMIN) || roles.includes(ROLE_OBSERVER))
}

/** CertificatesController.RevokeCertificate is [Authorize(Roles = SysAdmin)] only — CourseAdmin cannot revoke. */
export function isSysAdminRole(roles: string[] | undefined): boolean {
  return !!roles && roles.includes(ROLE_SYS_ADMIN)
}
