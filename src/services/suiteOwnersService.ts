import fs from 'node:fs'
import path from 'node:path'
import type { SuiteOwnersMap } from '@/lib/types'

let cached: SuiteOwnersMap | null = null

const candidatePaths = [
  path.join(process.cwd(), 'src/data/suite-owners.generated.json'),
]

export const getSuiteOwners = (): SuiteOwnersMap => {
  if (cached) return cached
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      cached = JSON.parse(fs.readFileSync(candidate, 'utf-8')) as SuiteOwnersMap
      return cached
    }
  }
  cached = {}
  return cached
}
