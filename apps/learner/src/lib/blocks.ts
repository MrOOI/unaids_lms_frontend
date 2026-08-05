/**
 * Content-block payload contracts.
 *
 * The backend stores `PayloadJson` as an opaque, per-locale string (see
 * Lms.Domain.Courses.ContentBlockTranslation) — it never validates or
 * interprets the shape. The shapes below are a *frontend-owned* convention
 * shared by the learner-facing renderer (components/lesson/blocks/*) and the
 * admin authoring form (views/admin/content/BlockEditor.vue). Keep both in
 * sync with this file.
 */
import type { ContentBlockType } from './api-types'

export interface RichTextPayload {
  html: string
}

export interface ImagePayload {
  assetId: string
  altText?: string
  caption?: string
}

export interface VideoPayload {
  /** Uploaded via /api/media, OR an external URL — at least one is set. */
  assetId?: string
  url?: string
  caption?: string
  /**
   * WebVTT subtitle asset for THIS locale's video (§13/§14). Content blocks
   * are already stored per-locale (ContentBlockTranslation), so each
   * locale's own payload carries its own subtitle track rather than a map
   * of every locale's tracks.
   */
  subtitleAssetId?: string
  /** Plain-text transcript, in this payload's own locale. */
  transcript?: string
}

export interface AudioPayload {
  assetId?: string
  url?: string
  caption?: string
}

export interface FileAttachmentPayload {
  assetId: string
  fileName: string
  sizeBytes?: number
}

export interface ExternalLinkPayload {
  url: string
  label: string
  description?: string
}

/** "Asosiy xabar" — the key-message callout every lesson page carries (§9). */
export interface KeyMessagePayload {
  html: string
}

export type BlockPayload =
  | RichTextPayload
  | ImagePayload
  | VideoPayload
  | AudioPayload
  | FileAttachmentPayload
  | ExternalLinkPayload
  | KeyMessagePayload

export function parsePayload<T>(payloadJson: string): Partial<T> {
  try {
    const parsed = JSON.parse(payloadJson)
    return parsed && typeof parsed === 'object' ? (parsed as Partial<T>) : {}
  } catch {
    return {}
  }
}

export function emptyPayload(type: ContentBlockType): BlockPayload {
  switch (type) {
    case 'RichText':
      return { html: '' }
    case 'KeyMessage':
      return { html: '' }
    case 'Image':
      return { assetId: '' }
    case 'Video':
      return {}
    case 'Audio':
      return {}
    case 'FileAttachment':
      return { assetId: '', fileName: '' }
    case 'ExternalLink':
      return { url: '', label: '' }
  }
}
