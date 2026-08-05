/**
 * Offline outbox for the two state-changing calls a learner makes mid-lesson
 * (mark lesson complete, submit a quiz attempt) — §13's low-bandwidth
 * requirement that a save survives a dropped connection instead of silently
 * failing. Both target endpoints are already idempotent server-side (a
 * repeat "complete" is a no-op, a repeat "submit" returns the stored
 * result), so replay-on-reconnect needs no separate idempotency-key scheme.
 *
 * Deliberately NOT built on the Service Worker Background Sync API: Safari
 * doesn't implement it, so a plain online/offline-listener + periodic-retry
 * queue running in normal app code is the more portable choice and is what
 * this module does. Persistence is IndexedDB so a queued save survives a
 * page reload while offline.
 */
import { reactive } from 'vue'

interface OutboxItem {
  id: string
  kind: string
  /** De-dup / UI lookup key, e.g. "lesson:{id}" or "attempt:{id}". A second enqueue under the same key replaces the payload rather than duplicating the entry. */
  key: string
  payload: unknown
  createdAt: number
}

type Handler = (payload: never) => Promise<void>

const DB_NAME = 'lms-offline-outbox'
const STORE_NAME = 'items'
const RETRY_INTERVAL_MS = 20_000

const handlers = new Map<string, Handler>()

/** Keys currently queued (pending or mid-retry) — read this to drive "queued" UI state. */
export const queuedKeys = reactive(new Set<string>())

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error as Error);
  })
  return dbPromise
}

async function dbGetAll(): Promise<OutboxItem[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result as OutboxItem[])
    request.onerror = () => reject(request.error as Error)
  })
}

async function dbPut(item: OutboxItem): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(item)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error as Error)
  })
}

async function dbDelete(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error as Error)
  })
}

/** A network-level failure (offline, DNS, connection reset) throws a bare TypeError from fetch() itself — distinct from ApiError, which means the server responded. */
function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError
}

/** Registered once per `kind` by the owning composable (useProgress, useQuizzes) at module load. */
export function registerOutboxHandler(kind: string, handler: Handler): void {
  handlers.set(kind, handler)
}

export function isQueued(key: string): boolean {
  return queuedKeys.has(key)
}

export async function enqueue(kind: string, key: string, payload: unknown): Promise<void> {
  const existing = (await dbGetAll()).find((i) => i.key === key)
  const item: OutboxItem = { id: existing?.id ?? crypto.randomUUID(), kind, key, payload, createdAt: Date.now() }
  await dbPut(item)
  queuedKeys.add(key)
  void flush()
}

let flushing = false

export async function flush(): Promise<void> {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const items = (await dbGetAll()).sort((a, b) => a.createdAt - b.createdAt)
    for (const item of items) {
      const handler = handlers.get(item.kind)
      if (!handler) continue
      try {
        await handler(item.payload as never)
        await dbDelete(item.id)
        queuedKeys.delete(item.key)
      } catch (err) {
        if (isNetworkError(err)) {
          break // still unreachable — stop for now, the retry timer/online event will try again
        }
        // A genuine server rejection (validation, etc.) can't be resolved by
        // retrying forever — drop it so it doesn't block later queued items.
        await dbDelete(item.id)
        queuedKeys.delete(item.key)
      }
    }
  } finally {
    flushing = false
  }
}

/** Call once at app startup to resume any saves queued from a previous session. */
export async function initOfflineOutbox(): Promise<void> {
  const items = await dbGetAll()
  for (const item of items) {
    queuedKeys.add(item.key)
  }
  window.addEventListener('online', () => void flush())
  setInterval(() => void flush(), RETRY_INTERVAL_MS)
  void flush()
}
