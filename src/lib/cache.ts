type Entry<T> = { value: T; expiresAt: number }

export class TtlCache<T> {
  private readonly store = new Map<string, Entry<T>>()

  constructor(private readonly defaultTtlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (entry.expiresAt < Date.now()) {
      this.store.delete(key)
      return undefined
    }
    return entry.value
  }

  set(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs) })
  }

  async getOrLoad(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T> {
    const hit = this.get(key)
    if (hit !== undefined) return hit
    const value = await loader()
    this.set(key, value, ttlMs)
    return value
  }
}

// Immutable cache: never expires within a single instance lifetime.
export class ImmutableCache<T> {
  private readonly store = new Map<string, T>()

  get(key: string): T | undefined {
    return this.store.get(key)
  }

  set(key: string, value: T): void {
    this.store.set(key, value)
  }

  async getOrLoad(key: string, loader: () => Promise<T>): Promise<T> {
    const hit = this.get(key)
    if (hit !== undefined) return hit
    const value = await loader()
    this.set(key, value)
    return value
  }
}
