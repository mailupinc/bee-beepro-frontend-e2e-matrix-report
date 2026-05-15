import { TtlCache } from '@/lib/cache'
import { env } from '@/lib/env'
import { buildBasePrefix, parseMergedKey } from '@/lib/paths'
import { listAllKeys } from '@/lib/s3'
import type { ReportKey } from '@/lib/types'

const manifestCache = new TtlCache<ReportKey[]>(env.manifestCacheTtlMs)

export type ManifestQuery = {
  env: string
  branch: string
  spec: string
  baseUrl: string
}

const cacheKey = (q: ManifestQuery): string => `${q.env}|${q.branch}|${q.spec}|${q.baseUrl}`

export const getManifest = async (q: ManifestQuery): Promise<ReportKey[]> => {
  return manifestCache.getOrLoad(cacheKey(q), async () => {
    const prefix = buildBasePrefix(q)
    const keys = await listAllKeys(prefix)
    const reports: ReportKey[] = []
    for (const key of keys) {
      if (!key.endsWith('/merged.json')) continue
      const parsed = parseMergedKey(key)
      if (!parsed) continue
      reports.push({ ...parsed, s3Key: key })
    }
    // Most recent first
    reports.sort((a, b) => {
      const aTs = `${a.date}-${a.time}`
      const bTs = `${b.date}-${b.time}`
      return bTs.localeCompare(aTs)
    })
    return reports
  })
}
