/**
 * Tests for the Dashboard's visibleData computation logic.
 * This logic is the most critical and bug-prone part of the app.
 * We test the pure computation extracted from the useMemo.
 */
import type { ReportsResponse, TestCell, TestRow, ReportMeta } from '@/lib/types'
import { makeCell, makeReport, makeRow } from '../../fixtures'

// Extract the computation logic from Dashboard (mirror of useMemo body)
function computeVisibleData(
  data: ReportsResponse,
  selectedReportIndices: number[],
) {
  const indices = selectedReportIndices
  if (indices.length === 1 && indices[0] === -1) {
    return { reports: [], rows: [], totals: { passingTests: 0, failingTests: 0, sumPasses: 0, sumFailures: 0, sumPending: 0, sumSkipped: 0, sumTests: 0, totalReports: 0 } }
  }

  const visibleReports = indices.length === 0 ? data.reports : indices.map((i) => data.reports[i]).filter(Boolean)
  const visibleRows = data.rows
    .map((row) => {
      const cells = indices.length === 0 ? row.cells : indices.map((i) => row.cells[i] ?? null)
      const presentCells = cells.filter((c): c is TestCell => c !== null)
      const runs = presentCells.length
      const failures = presentCells.filter((c) => c.failed).length
      const pendings = presentCells.filter((c) => c.pending).length
      const skips = presentCells.filter((c) => c.skipped).length
      const unstableRate = runs > 0 ? Number(((failures / runs) * 100).toFixed(1)) : 0
      return { ...row, cells, runs, failures, pendings, skips, unstableRate }
    })
    .filter((row) => indices.length === 0 || row.runs > 0)

  let passingTests = 0
  let failingTests = 0
  let sumPasses = 0
  let sumFailures = 0
  let sumPending = 0
  let sumSkipped = 0
  for (const row of visibleRows) {
    const presentCells = row.cells.filter((c): c is TestCell => c !== null)
    if (presentCells.length === 0) continue
    const allPassed = presentCells.every((c) => !c.failed && !c.pending && !c.skipped)
    if (row.failures > 0 || row.skips > 0) failingTests++
    else if (allPassed) passingTests++
    for (const c of presentCells) {
      if (c.failed) sumFailures++
      else if (c.pending) sumPending++
      else if (c.skipped) sumSkipped++
      else sumPasses++
    }
  }

  return {
    reports: visibleReports,
    rows: visibleRows,
    totals: {
      passingTests,
      failingTests,
      sumPasses,
      sumFailures,
      sumPending,
      sumSkipped,
      sumTests: sumPasses + sumFailures + sumPending + sumSkipped,
      totalReports: visibleReports.length,
    },
  }
}

describe('Dashboard visibleData computation', () => {
  const reports: ReportMeta[] = [makeReport(0), makeReport(1), makeReport(2)]

  const buildData = (rows: TestRow[]): ReportsResponse => ({
    reports,
    rows,
    totals: { passingTests: 0, failingTests: 0, sumPasses: 0, sumFailures: 0, sumPending: 0, sumSkipped: 0, sumTests: 0, totalReports: 3 },
  })

  describe('selecting all reports (indices=[])', () => {
    it('returns all rows and reports', () => {
      const data = buildData([makeRow()])
      const result = computeVisibleData(data, [])
      expect(result.reports).toHaveLength(3)
      expect(result.rows).toHaveLength(1)
    })

    it('counts Pass = Stable for all-passed tests with 1 report', () => {
      const row = makeRow({ cells: [makeCell('passed'), makeCell('passed'), makeCell('passed')] })
      const data = buildData([row])
      const result = computeVisibleData(data, [])
      expect(result.totals.passingTests).toBe(1) // Stable
      expect(result.totals.sumPasses).toBe(3) // 3 cells passed
    })
  })

  describe('selecting none (indices=[-1])', () => {
    it('returns zeros', () => {
      const data = buildData([makeRow()])
      const result = computeVisibleData(data, [-1])
      expect(result.reports).toHaveLength(0)
      expect(result.rows).toHaveLength(0)
      expect(result.totals.passingTests).toBe(0)
      expect(result.totals.sumPasses).toBe(0)
      expect(result.totals.totalReports).toBe(0)
    })
  })

  describe('selecting a subset of reports', () => {
    it('filters ghost rows (rows with no cells in selected reports)', () => {
      // Row only present in report 0
      const row = makeRow({ cells: [makeCell('passed'), null, null] })
      const data = buildData([row])
      // Select only report 1 and 2
      const result = computeVisibleData(data, [1, 2])
      expect(result.rows).toHaveLength(0) // ghost row filtered out
    })

    it('keeps rows that have cells in selected reports', () => {
      const row = makeRow({ cells: [null, makeCell('passed'), null] })
      const data = buildData([row])
      const result = computeVisibleData(data, [1])
      expect(result.rows).toHaveLength(1)
    })

    it('recomputes failure rate from selected reports only', () => {
      // Passed in 0, failed in 1, passed in 2
      const row = makeRow({ cells: [makeCell('passed'), makeCell('failed'), makeCell('passed')] })
      const data = buildData([row])
      // Select only report 1 (failed)
      const result = computeVisibleData(data, [1])
      expect(result.rows[0].unstableRate).toBe(100)
      expect(result.rows[0].failures).toBe(1)
    })
  })

  describe('Stable vs Pass consistency (THE BUG FIX)', () => {
    it('for 1 report with all-passed: Stable == Pass', () => {
      const row = makeRow({ cells: [makeCell('passed'), null, null] })
      const data = buildData([row])
      const result = computeVisibleData(data, [0])
      expect(result.totals.passingTests).toBe(1) // Stable
      expect(result.totals.sumPasses).toBe(1) // Pass
      expect(result.totals.passingTests).toBe(result.totals.sumPasses)
    })

    it('for 1 report with a failed test: Unstable count == Fail count', () => {
      const rows = [
        makeRow({ testName: 'pass', filePath: 'a.cy.ts', cells: [makeCell('passed'), null, null] }),
        makeRow({ testName: 'fail', filePath: 'b.cy.ts', cells: [makeCell('failed'), null, null] }),
      ]
      const data = buildData(rows)
      const result = computeVisibleData(data, [0])
      expect(result.totals.passingTests).toBe(1)
      expect(result.totals.failingTests).toBe(1)
      expect(result.totals.sumPasses).toBe(1)
      expect(result.totals.sumFailures).toBe(1)
    })

    it('for multiple reports: Pass = total passed cells, Stable = rows all-passed', () => {
      const rows = [
        // Passes in both reports → stable
        makeRow({ testName: 'always-pass', filePath: 'a.cy.ts', cells: [makeCell('passed'), makeCell('passed'), null] }),
        // Passes in 1, fails in 2 → unstable
        makeRow({ testName: 'flaky', filePath: 'b.cy.ts', cells: [makeCell('passed'), makeCell('failed'), null] }),
      ]
      const data = buildData(rows)
      const result = computeVisibleData(data, [0, 1])
      expect(result.totals.passingTests).toBe(1) // only always-pass is stable
      expect(result.totals.failingTests).toBe(1) // flaky is unstable
      expect(result.totals.sumPasses).toBe(3) // 2 (always-pass) + 1 (flaky report 0)
      expect(result.totals.sumFailures).toBe(1) // flaky report 1
    })
  })

  describe('pending and skipped handling', () => {
    it('pending tests are neither stable nor unstable', () => {
      const row = makeRow({ cells: [makeCell('pending'), makeCell('pending'), null] })
      const data = buildData([row])
      const result = computeVisibleData(data, [0, 1])
      expect(result.totals.passingTests).toBe(0) // not stable (pending is not passed)
      expect(result.totals.failingTests).toBe(0) // not unstable (no failures or skips)
      expect(result.totals.sumPending).toBe(2)
    })

    it('skipped tests are counted as unstable', () => {
      const row = makeRow({ cells: [makeCell('passed'), makeCell('skipped'), null] })
      const data = buildData([row])
      const result = computeVisibleData(data, [0, 1])
      expect(result.totals.failingTests).toBe(1) // unstable due to skip
      expect(result.totals.sumSkipped).toBe(1)
      expect(result.totals.sumPasses).toBe(1)
    })
  })

  describe('Total = Stable + Unstable + (neither)', () => {
    it('Total from stats component perspective', () => {
      const rows = [
        makeRow({ testName: 'stable', filePath: 'a.cy.ts', cells: [makeCell('passed'), makeCell('passed'), null] }),
        makeRow({ testName: 'unstable', filePath: 'b.cy.ts', cells: [makeCell('failed'), makeCell('passed'), null] }),
        makeRow({ testName: 'pending-only', filePath: 'c.cy.ts', cells: [makeCell('pending'), makeCell('pending'), null] }),
      ]
      const data = buildData(rows)
      const result = computeVisibleData(data, [0, 1])
      const total = result.totals.passingTests + result.totals.failingTests
      // pending-only is neither stable nor unstable
      expect(total).toBe(2)
      expect(result.rows).toHaveLength(3)
    })
  })

  describe('sumTests consistency', () => {
    it('sumTests = sumPasses + sumFailures + sumPending + sumSkipped', () => {
      const rows = [
        makeRow({ testName: 'a', filePath: 'a.cy.ts', cells: [makeCell('passed'), makeCell('failed'), makeCell('pending')] }),
        makeRow({ testName: 'b', filePath: 'b.cy.ts', cells: [makeCell('skipped'), makeCell('passed'), null] }),
      ]
      const data = buildData(rows)
      const result = computeVisibleData(data, [])
      expect(result.totals.sumTests).toBe(
        result.totals.sumPasses + result.totals.sumFailures + result.totals.sumPending + result.totals.sumSkipped,
      )
    })
  })
})
