/**
 * Question payload / answer / solution contracts.
 *
 * Confirmed against the backend source of truth:
 *  - Lms.Domain.Assessment.QuestionScorer (scoring key names: "correct",
 *    "selected", "value", "order", "pairs", "placements")
 *  - Lms.Infrastructure.Services.QuizService.PreparePayloadForLearner (which
 *    top-level payload arrays get shuffled per type: "options" for
 *    SingleChoice/MultiChoice/Scenario, "right" for Matching, "items" for
 *    Sequencing/DragAndDrop — and that a top-level "feedback": { correct,
 *    incorrect } object is stripped before the payload reaches the learner)
 *
 * PayloadJson (per locale, admin-authored) is what the learner sees;
 * SolutionJson (locale-independent) is never sent to the learner. Both are
 * driven by the same admin form (views/admin/quiz/QuestionEditor.vue) so they
 * must be kept in lockstep by id.
 */
import type { QuestionType } from './api-types'

export interface OptionItem {
  id: string
  text: string
}

export interface QuestionFeedback {
  correct?: string
  incorrect?: string
}

export interface SingleChoicePayload {
  prompt: string
  options: OptionItem[]
  feedback?: QuestionFeedback
}
export interface MultiChoicePayload {
  prompt: string
  options: OptionItem[]
  feedback?: QuestionFeedback
}
export interface TrueFalsePayload {
  prompt: string
  feedback?: QuestionFeedback
}
export interface MatchingPayload {
  prompt: string
  left: OptionItem[]
  right: OptionItem[]
  feedback?: QuestionFeedback
}
export interface SequencingPayload {
  prompt: string
  items: OptionItem[]
  feedback?: QuestionFeedback
}
export interface DragAndDropPayload {
  prompt: string
  items: OptionItem[]
  zones: OptionItem[]
  feedback?: QuestionFeedback
}
export interface ScenarioPayload {
  prompt: string
  scenario?: string
  options: OptionItem[]
  feedback?: QuestionFeedback
}
export interface ReflectionPayload {
  prompt: string
  placeholder?: string
}

export type QuestionPayload =
  | SingleChoicePayload
  | MultiChoicePayload
  | TrueFalsePayload
  | MatchingPayload
  | SequencingPayload
  | DragAndDropPayload
  | ScenarioPayload
  | ReflectionPayload

// ---- Solutions (never sent to learners; authored by admins) ----

export interface SingleChoiceSolution {
  correct: string
}
export interface MultiChoiceSolution {
  correct: string[]
}
export interface TrueFalseSolution {
  correct: boolean
}
export interface MatchingSolution {
  pairs: Record<string, string>
}
export interface SequencingSolution {
  order: string[]
}
export interface DragAndDropSolution {
  placements: Record<string, string>
}
export type ScenarioSolution = SingleChoiceSolution
export type ReflectionSolution = Record<string, never>

// ---- Answers (submitted by learners) ----

export interface SingleChoiceAnswer {
  selected: string
}
export interface MultiChoiceAnswer {
  selected: string[]
}
export interface TrueFalseAnswer {
  value: boolean
}
export interface MatchingAnswer {
  pairs: Record<string, string>
}
export interface SequencingAnswer {
  order: string[]
}
export interface DragAndDropAnswer {
  placements: Record<string, string>
}
export type ScenarioAnswer = SingleChoiceAnswer
export interface ReflectionAnswer {
  text: string
}

export function parseJson<T>(json: string, fallback: T): T {
  try {
    const value = JSON.parse(json)
    return value && typeof value === 'object' ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function emptyQuestionPayload(type: QuestionType): QuestionPayload {
  switch (type) {
    case 'SingleChoice':
    case 'MultiChoice':
    case 'Scenario':
      return { prompt: '', options: [{ id: crypto.randomUUID(), text: '' }] }
    case 'TrueFalse':
      return { prompt: '' }
    case 'Matching':
      return { prompt: '', left: [{ id: crypto.randomUUID(), text: '' }], right: [{ id: crypto.randomUUID(), text: '' }] }
    case 'Sequencing':
      return { prompt: '', items: [{ id: crypto.randomUUID(), text: '' }] }
    case 'DragAndDrop':
      return { prompt: '', items: [{ id: crypto.randomUUID(), text: '' }], zones: [{ id: crypto.randomUUID(), text: '' }] }
    case 'Reflection':
      return { prompt: '' }
  }
}

export function emptySolution(type: QuestionType): unknown {
  switch (type) {
    case 'SingleChoice':
    case 'Scenario':
      return { correct: '' }
    case 'MultiChoice':
      return { correct: [] }
    case 'TrueFalse':
      return { correct: true }
    case 'Matching':
      return { pairs: {} }
    case 'Sequencing':
      return { order: [] }
    case 'DragAndDrop':
      return { placements: {} }
    case 'Reflection':
      return {}
  }
}
