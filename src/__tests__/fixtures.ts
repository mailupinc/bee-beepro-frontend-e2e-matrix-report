import type { ReportMeta, ReportsResponse, TestCell, TestRow } from '@/lib/types'

export const makeCell = (state: 'passed' | 'failed' | 'pending' | 'skipped'): TestCell => ({
  failed: state === 'failed',
  pending: state === 'pending',
  skipped: state === 'skipped',
})

export const makeReport = (idx: number): ReportMeta => ({
  filename: `env-qa/branch-main/spec-all/base-default/2026-05-0${idx + 1}/09-00-00/merged.json`,
  date: `2026-05-0${idx + 1}`,
  time: '09-00-00',
  stats: { passes: 450, failures: 5, pending: 40, skipped: 2, tests: 497 },
})

export const makeRow = (overrides?: Partial<TestRow>): TestRow => ({
  testName: 'My Suite > should do something',
  filePath: 'myFeature/my-test.cy.ts',
  owner: 'alice',
  creator: 'bob',
  failureRate: 0,
  runs: 3,
  failures: 0,
  pendings: 0,
  skips: 0,
  cells: [makeCell('passed'), makeCell('passed'), makeCell('passed')],
  ...overrides,
})

export const makeReportsResponse = (overrides?: Partial<ReportsResponse>): ReportsResponse => ({
  reports: [makeReport(0), makeReport(1), makeReport(2)],
  rows: [
    makeRow(),
    makeRow({ testName: 'My Suite > should fail', filePath: 'other/fail.cy.ts', owner: 'charlie', failures: 2, failureRate: 66.7, cells: [makeCell('failed'), makeCell('passed'), makeCell('failed')] }),
    makeRow({ testName: 'My Suite > pending test', filePath: 'other/pending.cy.ts', owner: 'alice', pendings: 3, cells: [makeCell('pending'), makeCell('pending'), makeCell('pending')] }),
  ],
  totals: {
    passingTests: 1,
    failingTests: 1,
    sumPasses: 6,
    sumFailures: 2,
    sumPending: 3,
    sumSkipped: 0,
    sumTests: 11,
    totalReports: 3,
  },
  ...overrides,
})
