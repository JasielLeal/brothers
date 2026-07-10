'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 1024px) and (max-width: 1439px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/** True for notebook-sized viewports (1024–1439px), between tablet and full desktop. */
export function useIsNotebook() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
