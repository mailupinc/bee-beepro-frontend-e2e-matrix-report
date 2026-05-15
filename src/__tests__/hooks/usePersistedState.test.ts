import { renderHook, act } from '@testing-library/react'
import { usePersistedState } from '@/hooks/usePersistedState'

describe('usePersistedState', () => {
  const getKey = (key: string) => `history-report-filters-v1:${key}`

  beforeEach(() => {
    localStorage.clear()
  })

  it('returns initial value when no stored value', () => {
    const { result } = renderHook(() => usePersistedState('test', 'initial'))
    expect(result.current[0]).toBe('initial')
  })

  it('reads stored value from localStorage', () => {
    localStorage.setItem(getKey('test'), JSON.stringify('stored'))
    const { result } = renderHook(() => usePersistedState('test', 'initial'))
    // After hydration effect runs
    expect(result.current[0]).toBe('stored')
  })

  it('writes to localStorage on update', () => {
    const { result } = renderHook(() => usePersistedState('test', 'initial'))
    act(() => result.current[1]('updated'))
    expect(result.current[0]).toBe('updated')
    expect(JSON.parse(localStorage.getItem(getKey('test'))!)).toBe('updated')
  })

  it('handles complex objects', () => {
    const initial = { branch: 'main', env: 'qa' }
    const { result } = renderHook(() => usePersistedState('obj', initial))
    const updated = { branch: 'feat', env: 'staging' }
    act(() => result.current[1](updated))
    expect(result.current[0]).toEqual(updated)
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(getKey('corrupt'), 'not-valid-json{{{')
    const { result } = renderHook(() => usePersistedState('corrupt', 'fallback'))
    expect(result.current[0]).toBe('fallback')
  })
})
