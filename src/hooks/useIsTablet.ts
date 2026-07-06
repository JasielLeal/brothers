'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(min-width: 640px) and (max-width: 1023px)'

function subscribe(callback: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

/** True for tablet-sized viewports (Tailwind's sm–lg range, 640–1023px). */
export function useIsTablet() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  )
}
