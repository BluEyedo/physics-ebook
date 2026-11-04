import { createContext, useContext, useEffect, useState } from 'react'

/** True while the page that contains a component is showing (so animations can pause). */
export const PageVisibleContext = createContext(true)

export const usePageVisible = () => useContext(PageVisibleContext)

/** Seconds elapsed while `running` is true (pauses when false). */
export function useClock(running: boolean) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (!running) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1)
      last = now
      setT((x) => x + dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [running])
  return t
}

/**
 * Tiny external store so non-React code (e.g. a three.js scene) can push values that React reads
 * with useSyncExternalStore(store.subscribe, store.get).
 */
export function createValueStore<T>(initial: T) {
  let value = initial
  const subs = new Set<() => void>()
  return {
    get: () => value,
    set: (next: T) => {
      value = next
      subs.forEach((f) => f())
    },
    subscribe: (f: () => void) => {
      subs.add(f)
      return () => {
        subs.delete(f)
      }
    },
  }
}

/** A looping 0→1 phase that can be paused and scrubbed. */
export function usePhase(period: number, active: boolean) {
  const [playing, setPlaying] = useState(true)
  const [offset, setOffset] = useState(0)
  const t = useClock(active && playing)
  const phase = ((((t + offset) % period) + period) % period) / period
  return {
    phase,
    playing,
    toggle: () => setPlaying((p) => !p),
    seek: (ph: number) => {
      setPlaying(false)
      setOffset(ph * period - t)
    },
  }
}
