'use client'

import { useEffect, useState } from 'react'

const STORAGE_KEY = 'history-report-filters-v1'

export const usePersistedState = <T,>(key: string, initial: T): [T, (next: T) => void] => {
  const [value, setValue] = useState<T>(initial)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(`${STORAGE_KEY}:${key}`)
      if (raw) setValue(JSON.parse(raw) as T)
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [key])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(`${STORAGE_KEY}:${key}`, JSON.stringify(value))
    } catch {
      // ignore
    }
  }, [hydrated, key, value])

  return [value, setValue]
}
