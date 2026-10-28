"use client";

import * as React from 'react'

export function useIsMobile(breakpoint = 768) {
  const mobileQuery = `(max-width: ${breakpoint - 1}px)`
  return React.useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(mobileQuery)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(mobileQuery).matches,
    () => false
  )
}
