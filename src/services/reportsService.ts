import { aggregateReports } from './reportAggregator'
import { getManifest } from './manifestService'
import { getSuiteOwners } from './suiteOwnersService'
import type { ReportsQuery, ReportsResponse, TestRow } from '@/lib/types'

const matchesSearch = (row: TestRow, search: string | null): boolean => {
  if (!search) return true
  const term = search.toLowerCase()
  return row.testName.toLowerCase().includes(term) || row.filePath.toLowerCase().includes(term)
}

const matchesOwners = (row: TestRow, owners: string[] | null): boolean => {
  if (!owners || owners.length === 0) return true
  return owners.includes(row.owner)
}

export const getReports = async (query: ReportsQuery): Promise<ReportsResponse> => {
  const manifest = await getManifest({
    env: query.env,
    branch: query.branch,
    spec: query.spec,
    baseUrl: query.baseUrl,
  })

  const selected = manifest.slice(0, query.nReports)
  const owners = getSuiteOwners()
  const { rows: allRows, reportStats } = await aggregateReports({ reports: selected, owners })

  const filtered = allRows
    .filter((row) => matchesSearch(row, query.search))
    .filter((row) => matchesOwners(row, query.owners))
    .sort((a, b) => b.unstableRate - a.unstableRate || a.testName.localeCompare(b.testName))

  const failingTests = filtered.filter((r) => r.failures > 0).length
  const passingTests = filtered.filter((r) => r.failures === 0).length

  // Sum raw stats across all selected reports
  const summed = selected.reduce(
    (acc, r) => {
      const s = reportStats.get(r.s3Key)
      return {
        passes: acc.passes + (s?.passes ?? 0),
        failures: acc.failures + (s?.failures ?? 0),
        pending: acc.pending + (s?.pending ?? 0),
        skipped: acc.skipped + (s?.skipped ?? 0),
        tests: acc.tests + (s?.tests ?? 0),
      }
    },
    { passes: 0, failures: 0, pending: 0, skipped: 0, tests: 0 },
  )

  return {
    reports: selected.map((r) => {
      const stats = reportStats.get(r.s3Key)
      return {
        filename: r.s3Key,
        date: r.date,
        time: r.time,
        stats: {
          passes: stats?.passes ?? 0,
          failures: stats?.failures ?? 0,
          pending: stats?.pending ?? 0,
          skipped: stats?.skipped ?? 0,
          tests: stats?.tests ?? 0,
        },
      }
    }),
    rows: filtered,
    totals: {
      passingTests,
      failingTests,
      sumPasses: summed.passes,
      sumFailures: summed.failures,
      sumPending: summed.pending,
      sumSkipped: summed.skipped,
      sumTests: summed.tests,
      totalReports: selected.length,
    },
  }
}
