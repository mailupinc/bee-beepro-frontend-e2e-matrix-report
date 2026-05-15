import { getReports } from '@/services/reportsService'
import type { ReportsQuery, TestRow } from '@/lib/types'

jest.mock('@/services/reportAggregator', () => ({
  aggregateReports: jest.fn(),
}))
jest.mock('@/services/manifestService', () => ({
  getManifest: jest.fn(),
}))
jest.mock('@/services/suiteOwnersService', () => ({
  getSuiteOwners: jest.fn().mockReturnValue({}),
}))

import { aggregateReports } from '@/services/reportAggregator'
import { getManifest } from '@/services/manifestService'

const mockAggregate = aggregateReports as jest.MockedFunction<typeof aggregateReports>
const mockManifest = getManifest as jest.MockedFunction<typeof getManifest>

const baseQuery: ReportsQuery = {
  branch: 'main',
  env: 'qa',
  spec: 'all',
  baseUrl: 'default',
  nReports: 10,
  search: null,
  owners: null,
}

const makeManifestEntry = (n: number) => ({
  date: `2026-05-${String(n).padStart(2, '0')}`,
  time: '09-00-00',
  s3Key: `path/2026-05-${String(n).padStart(2, '0')}/09-00-00/merged.json`,
})

const makeTestRow = (name: string, owner: string, failures = 0): TestRow => ({
  testName: name,
  filePath: `feat/${name}.cy.ts`,
  owner,
  creator: 'creator',
  failureRate: failures > 0 ? 50 : 0,
  runs: 2,
  failures,
  pendings: 0,
  skips: 0,
  cells: [
    { failed: failures > 0, pending: false, skipped: false },
    { failed: false, pending: false, skipped: false },
  ],
})

describe('reportsService', () => {
  beforeEach(() => {
    mockManifest.mockReset()
    mockAggregate.mockReset()
  })

  it('returns correct structure', async () => {
    const manifest = [makeManifestEntry(1), makeManifestEntry(2)]
    mockManifest.mockResolvedValue(manifest)
    const rows = [makeTestRow('test-a', 'alice')]
    const reportStats = new Map([
      [manifest[0].s3Key, { passes: 5, failures: 0, pending: 1, skipped: 0, tests: 6 }],
      [manifest[1].s3Key, { passes: 4, failures: 1, pending: 0, skipped: 0, tests: 5 }],
    ])
    mockAggregate.mockResolvedValue({ rows, reportStats })

    const result = await getReports(baseQuery)

    expect(result.reports).toHaveLength(2)
    expect(result.reports[0].stats.passes).toBe(5)
    expect(result.reports[1].stats.failures).toBe(1)
    expect(result.rows).toHaveLength(1)
    expect(result.totals.totalReports).toBe(2) // not used in this context but returned
  })

  it('respects nReports limit', async () => {
    const manifest = Array.from({ length: 20 }, (_, i) => makeManifestEntry(i + 1))
    mockManifest.mockResolvedValue(manifest)
    mockAggregate.mockResolvedValue({ rows: [], reportStats: new Map() })

    await getReports({ ...baseQuery, nReports: 5 })

    expect(mockAggregate).toHaveBeenCalledWith(
      expect.objectContaining({ reports: expect.arrayContaining([manifest[0]]) }),
    )
    const calledReports = (mockAggregate.mock.calls[0][0] as { reports: unknown[] }).reports
    expect(calledReports).toHaveLength(5)
  })

  it('filters by search term (test name)', async () => {
    mockManifest.mockResolvedValue([makeManifestEntry(1)])
    const rows = [makeTestRow('login-test', 'alice'), makeTestRow('checkout', 'bob')]
    mockAggregate.mockResolvedValue({ rows, reportStats: new Map() })

    const result = await getReports({ ...baseQuery, search: 'login' })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].testName).toBe('login-test')
  })

  it('filters by search term (file path)', async () => {
    mockManifest.mockResolvedValue([makeManifestEntry(1)])
    const rows = [makeTestRow('test-a', 'alice'), makeTestRow('test-b', 'bob')]
    mockAggregate.mockResolvedValue({ rows, reportStats: new Map() })

    const result = await getReports({ ...baseQuery, search: 'feat/test-a' })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].testName).toBe('test-a')
  })

  it('filters by owners', async () => {
    mockManifest.mockResolvedValue([makeManifestEntry(1)])
    const rows = [makeTestRow('test-a', 'alice'), makeTestRow('test-b', 'bob')]
    mockAggregate.mockResolvedValue({ rows, reportStats: new Map() })

    const result = await getReports({ ...baseQuery, owners: ['alice'] })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].owner).toBe('alice')
  })

  it('sorts by failure rate descending', async () => {
    mockManifest.mockResolvedValue([makeManifestEntry(1)])
    const rows = [
      makeTestRow('stable', 'alice', 0),
      makeTestRow('flaky', 'bob', 1),
    ]
    mockAggregate.mockResolvedValue({ rows, reportStats: new Map() })

    const result = await getReports(baseQuery)

    expect(result.rows[0].testName).toBe('flaky')
    expect(result.rows[1].testName).toBe('stable')
  })

  it('computes passingTests and failingTests from filtered rows', async () => {
    mockManifest.mockResolvedValue([makeManifestEntry(1)])
    const rows = [
      makeTestRow('pass1', 'alice', 0),
      makeTestRow('pass2', 'alice', 0),
      makeTestRow('fail1', 'alice', 1),
    ]
    mockAggregate.mockResolvedValue({ rows, reportStats: new Map() })

    const result = await getReports(baseQuery)

    expect(result.totals.passingTests).toBe(2)
    expect(result.totals.failingTests).toBe(1)
  })
})
