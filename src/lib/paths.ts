import { env } from './env'

export const DEFAULTS = {
  branch: 'main',
  env: 'qa',
  spec: 'all',
  baseUrl: 'default',
  nReports: 15,
} as const

export const buildBasePrefix = (parts: { env: string; branch: string; spec: string; baseUrl: string }): string => {
  const root = env.rootPrefix()
  return `${root}/env-${parts.env}/branch-${parts.branch}/spec-${parts.spec}/base-${parts.baseUrl}/`
}

export const buildLevelPrefix = (segments: Array<{ key: string; value: string }>): string => {
  const root = env.rootPrefix()
  const tail = segments.map(({ key, value }) => `${key}-${value}/`).join('')
  return `${root}/${tail}`
}

const MERGED_REGEX = /\/(\d{4}-\d{2}-\d{2})\/(\d{2}-\d{2}-\d{2})\/merged\.json$/

export const parseMergedKey = (key: string): { date: string; time: string } | null => {
  const match = MERGED_REGEX.exec(key)
  if (!match) return null
  return { date: match[1], time: match[2] }
}

export const stripSegmentPrefix = (commonPrefix: string, key: string): string => {
  // commonPrefix like "env-qa/" → strip prefix & trailing slash
  return commonPrefix.replace(/\/$/, '').replace(new RegExp(`^${key}-`), '')
}
