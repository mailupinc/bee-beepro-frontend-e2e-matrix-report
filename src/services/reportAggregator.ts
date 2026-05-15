import { ImmutableCache } from '@/lib/cache'
import { getJson } from '@/lib/s3'
import type { MochawesomeReport, MochawesomeSuite, MochawesomeTest, ReportKey, SuiteOwnersMap, TestRow } from '@/lib/types'

const reportCache = new ImmutableCache<MochawesomeReport>()

const fetchReport = (key: string): Promise<MochawesomeReport> =>
  reportCache.getOrLoad(key, () => getJson<MochawesomeReport>(key))

const normalizeFilePath = (filePath?: string): string =>
  (filePath ?? '').replace(/^cypress\/e2e\//, '')

type CellState = 'failed' | 'passed' | 'pending' | 'skipped'

type TestAccumulator = {
  testName: string
  filePath: string
  owner: string
  creator: string
  cells: Map<string, CellState>
}

const walkSuite = (
  suite: MochawesomeSuite,
  reportKey: string,
  owners: SuiteOwnersMap,
  acc: Map<string, TestAccumulator>,
  parentTitle = '',
  parentFile = '',
): void => {
  const suiteTitle = suite.title ? (parentTitle ? `${parentTitle} > ${suite.title}` : suite.title) : parentTitle
  const suiteFile = suite.file || suite.fullFile || parentFile

  suite.tests?.forEach((test: MochawesomeTest) => {
    const fullName = suiteTitle ? `${suiteTitle} > ${test.title}` : test.title
    const filePath = normalizeFilePath(suiteFile)
    const ownerInfo = owners[filePath] ?? { owner: 'unknown', creator: 'unknown' }
    const dedupKey = `${filePath}::${fullName}`

    let entry = acc.get(dedupKey)
    if (!entry) {
      entry = {
        testName: fullName,
        filePath,
        owner: ownerInfo.owner,
        creator: ownerInfo.creator,
        cells: new Map(),
      }
      acc.set(dedupKey, entry)
    }

    const state: CellState = test.state === 'failed' ? 'failed'
      : test.state === 'pending' ? 'pending'
      : test.state === 'skipped' ? 'skipped'
      : 'passed'
    const existing = entry.cells.get(reportKey)
    // Priority: failed > passed > skipped > pending (retries: if it passes after failing, failed wins)
    const priority: Record<CellState, number> = { failed: 3, passed: 2, skipped: 1, pending: 0 }
    if (!existing || priority[state] > priority[existing]) {
      entry.cells.set(reportKey, state)
    }
  })

  suite.suites?.forEach((nested) => walkSuite(nested, reportKey, owners, acc, suiteTitle, suiteFile))
}

export type AggregateInput = {
  reports: ReportKey[]
  owners: SuiteOwnersMap
}

export type ReportStats = {
  passes: number
  failures: number
  pending: number
  skipped: number
  tests: number
}

export type AggregateResult = {
  rows: TestRow[]
  reportStats: Map<string, ReportStats>
}

export const aggregateReports = async ({ reports, owners }: AggregateInput): Promise<AggregateResult> => {
  const acc = new Map<string, TestAccumulator>()
  const reportStats = new Map<string, ReportStats>()

  const reportData = await Promise.all(
    reports.map(async (r) => ({ key: r.s3Key, data: await fetchReport(r.s3Key) })),
  )

  for (const { key, data } of reportData) {
    data.results?.forEach((root) => walkSuite(root, key, owners, acc))
    reportStats.set(key, {
      passes: data.stats?.passes ?? 0,
      failures: data.stats?.failures ?? 0,
      pending: data.stats?.pending ?? 0,
      skipped: data.stats?.skipped ?? 0,
      tests: data.stats?.tests ?? 0,
    })
  }

  const orderedKeys = reports.map((r) => r.s3Key)

  const rows = Array.from(acc.values())
    .filter((entry) => entry.owner !== 'unknown')
    .map((entry) => {
      const cells = orderedKeys.map((k) => {
        const state = entry.cells.get(k)
        if (state === undefined) return null
        return { failed: state === 'failed', pending: state === 'pending', skipped: state === 'skipped' }
      })
      const runs = cells.filter((c) => c !== null).length
      const failures = cells.filter((c) => c?.failed).length
      const pendings = cells.filter((c) => c?.pending).length
      const skips = cells.filter((c) => c?.skipped).length
      const unstableRate = runs > 0 ? Number((((failures + skips) / runs) * 100).toFixed(1)) : 0
      return {
        testName: entry.testName,
        filePath: entry.filePath,
        owner: entry.owner,
        creator: entry.creator,
        cells,
        runs,
        failures,
        pendings,
        skips,
        unstableRate,
      }
    })

  return { rows, reportStats }
}
