import { useSyncExternalStore } from 'react'

/** Ticked boxes, kept in this browser. One flat map of id -> true, shared by every page. */
const KEY = 'agentLabProgress'
let done: Record<string, true> = read()
const subs = new Set<() => void>()

function read(): Record<string, true> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || {}
  } catch {
    return {}
  }
}

export function setDone(id: string, on: boolean) {
  done = { ...done }
  if (on) done[id] = true
  else delete done[id]
  try {
    localStorage.setItem(KEY, JSON.stringify(done))
  } catch {
    // private window: progress lasts until the tab closes
  }
  subs.forEach((f) => f())
}

export function useProgress() {
  return useSyncExternalStore(
    (f) => {
      subs.add(f)
      return () => subs.delete(f)
    },
    () => done,
  )
}

export const share = (p: Record<string, true>, ids: string[]) => (ids.length ? ids.filter((i) => p[i]).length / ids.length : 0)
