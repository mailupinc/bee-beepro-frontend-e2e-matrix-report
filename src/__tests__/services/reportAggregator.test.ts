import type { MochawesomeReport, ReportKey } from '@/lib/types'

const mockGetJson = jest.fn()
jest.mock('@/lib/s3', () => ({
  getJson: (...args: unknown[]) => mockGetJson(...args),
}))

const mockAssignOwner = jest.fn()
jest.mock('@/services/suiteOwnersService', () => ({
  assignOwner: (filePath: string) => mockAssignOwner(filePath),
}))

// We need a fresh module for each test to avoid the ImmutableCache persisting
let aggregateReports: typeof import('@/services/reportAggregator').aggregateReports
beforeEach(() => {
  jest.resetModules()
  mockGetJson.mockReset()
  mockAssignOwner.mockReset()
  // Default: assign owner based on a simple map
  mockAssignOwner.mockImplementation((filePath: string) => {
    const map: Record<string, string> = {
      'myFeature/test-a.cy.ts': 'alice',
      'myFeature/test-b.cy.ts': 'charlie',
      'otherFeature/test-c.cy.ts': 'eve',
    }
    return map[filePath] ?? 'unknown'
  })
  // Re-require after resetModules to get a fresh ImmutableCache
  return import('@/services/reportAggregator').then((mod) => {
    aggregateReports = mod.aggregateReports
  })
})

const makeReport = (tests: Array<{ title: string; state: string; file: string }>): MochawesomeReport => ({
  stats: {
    tests: tests.length,
    passes: tests.filter((t) => t.state === 'passed').length,
    failures: tests.filter((t) => t.state === 'failed').length,
    pending: tests.filter((t) => t.state === 'pending').length,
    skipped: tests.filter((t) => t.state === 'skipped').length,
  },
  results: Object.entries(
    tests.reduce((acc, t) => {
      if (!acc[t.file]) acc[t.file] = []
      acc[t.file].push(t)
      return acc
    }, {} as Record<string, typeof tests>),
  ).map(([file, fileTests]) => ({
    file: `cypress/e2e/${file}`,
    title: '',
    suites: [{
      title: 'Suite',
      tests: fileTests.map((t) => ({ title: t.title, state: t.state })),
    }],
  })),
})

const report1Key: ReportKey = { date: '2026-05-01', time: '09-00-00', s3Key: 'path/2026-05-01/09-00-00/merged.json' }
const report2Key: ReportKey = { date: '2026-05-02', time: '09-00-00', s3Key: 'path/2026-05-02/09-00-00/merged.json' }

describe('reportAggregator', () => {
  beforeEach(() => {
    mockGetJson.mockReset()
  })

  it('aggregates a single report correctly', async () => {
    const report = makeReport([
      { title: 'test 1', state: 'passed', file: 'myFeature/test-a.cy.ts' },
      { title: 'test 2', state: 'failed', file: 'myFeature/test-a.cy.ts' },
      { title: 'test 3', state: 'pending', file: 'myFeature/test-b.cy.ts' },
    ])
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows).toHaveLength(3)
    expect(result.rows.find((r) => r.testName === 'Suite > test 1')?.cells[0]).toEqual({ failed: false, pending: false, skipped: false })
    expect(result.rows.find((r) => r.testName === 'Suite > test 2')?.cells[0]).toEqual({ failed: true, pending: false, skipped: false })
    expect(result.rows.find((r) => r.testName === 'Suite > test 3')?.cells[0]).toEqual({ failed: false, pending: true, skipped: false })
  })

  it('deduplicates tests with same filePath::fullName (failed wins over passed)', async () => {
    const report: MochawesomeReport = {
      stats: { tests: 2, passes: 1, failures: 1, pending: 0, skipped: 0 },
      results: [{
        file: 'cypress/e2e/myFeature/test-a.cy.ts',
        title: '',
        suites: [{
          title: 'Suite',
          tests: [
            { title: 'duplicated test', state: 'passed' },
            { title: 'duplicated test', state: 'failed' },
          ],
        }],
      }],
    }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    const row = result.rows.find((r) => r.testName === 'Suite > duplicated test')!
    expect(row.cells[0]).toEqual({ failed: true, pending: false, skipped: false })
    // Only one row for the duplicate
    expect(result.rows.filter((r) => r.testName === 'Suite > duplicated test')).toHaveLength(1)
  })

  it('filters out tests with unknown owner', async () => {
    const report = makeReport([
      { title: 'known test', state: 'passed', file: 'myFeature/test-a.cy.ts' },
      { title: 'unknown test', state: 'passed', file: 'unregistered/unknown.cy.ts' },
    ])
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].testName).toBe('Suite > known test')
  })

  it('aggregates multiple reports into matrix cells', async () => {
    const report1 = makeReport([
      { title: 'test 1', state: 'passed', file: 'myFeature/test-a.cy.ts' },
    ])
    const report2 = makeReport([
      { title: 'test 1', state: 'failed', file: 'myFeature/test-a.cy.ts' },
    ])
    mockGetJson.mockImplementation(async (key: string) => {
      if (key === report1Key.s3Key) return report1
      return report2
    })

    const result = await aggregateReports({ reports: [report1Key, report2Key] })

    expect(result.rows).toHaveLength(1)
    const row = result.rows[0]
    expect(row.cells[0]).toEqual({ failed: false, pending: false, skipped: false }) // passed in report 1
    expect(row.cells[1]).toEqual({ failed: true, pending: false, skipped: false }) // failed in report 2
    expect(row.failures).toBe(1)
    expect(row.runs).toBe(2)
    expect(row.unstableRate).toBe(50)
  })

  it('returns null cells when test is absent from a report', async () => {
    const report1 = makeReport([
      { title: 'test 1', state: 'passed', file: 'myFeature/test-a.cy.ts' },
    ])
    const report2 = makeReport([
      { title: 'test 2', state: 'passed', file: 'myFeature/test-b.cy.ts' },
    ])
    mockGetJson.mockImplementation(async (key: string) => {
      if (key === report1Key.s3Key) return report1
      return report2
    })

    const result = await aggregateReports({ reports: [report1Key, report2Key] })

    const row1 = result.rows.find((r) => r.testName === 'Suite > test 1')!
    expect(row1.cells[0]).not.toBeNull() // present in report 1
    expect(row1.cells[1]).toBeNull() // absent from report 2
    expect(row1.runs).toBe(1)

    const row2 = result.rows.find((r) => r.testName === 'Suite > test 2')!
    expect(row2.cells[0]).toBeNull() // absent from report 1
    expect(row2.cells[1]).not.toBeNull() // present in report 2
  })

  it('returns reportStats with raw mochawesome stats', async () => {
    const report: MochawesomeReport = {
      stats: { tests: 10, passes: 8, failures: 1, pending: 1, skipped: 0 },
      results: [],
    }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    const stats = result.reportStats.get(report1Key.s3Key)!
    expect(stats.tests).toBe(10)
    expect(stats.passes).toBe(8)
    expect(stats.failures).toBe(1)
    expect(stats.pending).toBe(1)
    expect(stats.skipped).toBe(0)
  })

  it('assigns correct owner from CODEOWNERS via assignOwner', async () => {
    const report = makeReport([
      { title: 'test', state: 'passed', file: 'myFeature/test-b.cy.ts' },
    ])
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows[0].owner).toBe('charlie')
  })

  it('handles nested suites and propagates parentFile', async () => {
    const report: MochawesomeReport = {
      stats: { tests: 1, passes: 1, failures: 0, pending: 0, skipped: 0 },
      results: [{
        file: 'cypress/e2e/myFeature/test-a.cy.ts',
        title: '',
        suites: [{
          title: 'Outer',
          suites: [{
            title: 'Inner',
            tests: [{ title: 'deep test', state: 'passed' }],
          }],
        }],
      }],
    }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows[0].testName).toBe('Outer > Inner > deep test')
    expect(result.rows[0].filePath).toBe('myFeature/test-a.cy.ts')
  })

  it('handles skipped state', async () => {
    const report = makeReport([
      { title: 'skipped test', state: 'skipped', file: 'myFeature/test-a.cy.ts' },
    ])
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows[0].cells[0]).toEqual({ failed: false, pending: false, skipped: true })
    expect(result.rows[0].skips).toBe(1)
  })

  it('priority: failed > passed > skipped > pending for dedup', async () => {
    const report: MochawesomeReport = {
      stats: { tests: 3, passes: 1, failures: 1, pending: 1, skipped: 0 },
      results: [{
        file: 'cypress/e2e/myFeature/test-a.cy.ts',
        title: '',
        suites: [{
          title: 'Suite',
          tests: [
            { title: 'retry test', state: 'pending' },
            { title: 'retry test', state: 'passed' },
            { title: 'retry test', state: 'failed' },
          ],
        }],
      }],
    }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    // Failed has highest priority
    expect(result.rows[0].cells[0]).toEqual({ failed: true, pending: false, skipped: false })
  })

  it('handles empty results array gracefully', async () => {
    const report: MochawesomeReport = { stats: { tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 }, results: [] }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.rows).toHaveLength(0)
    expect(result.reportStats.get(report1Key.s3Key)).toEqual({ tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 })
  })

  it('handles report with missing stats', async () => {
    const report: MochawesomeReport = { results: [] }
    mockGetJson.mockResolvedValue(report)

    const result = await aggregateReports({ reports: [report1Key] })

    expect(result.reportStats.get(report1Key.s3Key)).toEqual({ tests: 0, passes: 0, failures: 0, pending: 0, skipped: 0 })
  })
})
