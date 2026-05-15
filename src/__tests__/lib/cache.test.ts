import { TtlCache, ImmutableCache } from '@/lib/cache'

describe('TtlCache', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('returns undefined for missing keys', () => {
    const cache = new TtlCache<string>(1000)
    expect(cache.get('nope')).toBeUndefined()
  })

  it('stores and retrieves a value', () => {
    const cache = new TtlCache<number>(5000)
    cache.set('x', 42)
    expect(cache.get('x')).toBe(42)
  })

  it('expires entries after TTL', () => {
    const cache = new TtlCache<string>(1000)
    cache.set('key', 'value')
    expect(cache.get('key')).toBe('value')
    jest.advanceTimersByTime(1001)
    expect(cache.get('key')).toBeUndefined()
  })

  it('supports custom TTL per entry', () => {
    const cache = new TtlCache<string>(10000)
    cache.set('short', 'v', 500)
    jest.advanceTimersByTime(600)
    expect(cache.get('short')).toBeUndefined()
  })

  it('getOrLoad returns cached value without calling loader', async () => {
    const cache = new TtlCache<string>(5000)
    cache.set('k', 'cached')
    const loader = jest.fn()
    const result = await cache.getOrLoad('k', loader)
    expect(result).toBe('cached')
    expect(loader).not.toHaveBeenCalled()
  })

  it('getOrLoad calls loader on miss and caches result', async () => {
    const cache = new TtlCache<string>(5000)
    const loader = jest.fn().mockResolvedValue('loaded')
    const result = await cache.getOrLoad('k', loader)
    expect(result).toBe('loaded')
    expect(loader).toHaveBeenCalledTimes(1)
    expect(cache.get('k')).toBe('loaded')
  })

  it('getOrLoad calls loader again after expiry', async () => {
    const cache = new TtlCache<string>(100)
    const loader = jest.fn().mockResolvedValue('fresh')
    await cache.getOrLoad('k', loader)
    jest.advanceTimersByTime(200)
    await cache.getOrLoad('k', loader)
    expect(loader).toHaveBeenCalledTimes(2)
  })
})

describe('ImmutableCache', () => {
  it('returns undefined for missing keys', () => {
    const cache = new ImmutableCache<string>()
    expect(cache.get('x')).toBeUndefined()
  })

  it('stores and retrieves permanently', () => {
    const cache = new ImmutableCache<number>()
    cache.set('n', 99)
    expect(cache.get('n')).toBe(99)
  })

  it('getOrLoad caches permanently', async () => {
    const cache = new ImmutableCache<string>()
    const loader = jest.fn().mockResolvedValue('immutable')
    await cache.getOrLoad('k', loader)
    await cache.getOrLoad('k', loader)
    await cache.getOrLoad('k', loader)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(cache.get('k')).toBe('immutable')
  })
})
