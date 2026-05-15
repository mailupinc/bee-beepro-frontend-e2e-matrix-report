'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Filters from '@/components/Filters/Filters'
import Stats from '@/components/Stats/Stats'
import Matrix from '@/components/Matrix/Matrix'
import ReportDrawer from '@/components/ReportDrawer/ReportDrawer'
import Loading from '@/components/Loading/Loading'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'
import { usePersistedState } from '@/hooks/usePersistedState'
import { useReports, type DashboardQuery } from '@/hooks/useReports'
import { useFilters } from '@/hooks/useFilters'
import styles from './Dashboard.module.scss'

const INITIAL: DashboardQuery = {
  branch: 'main',
  env: 'qa',
  spec: 'all',
  baseUrl: 'default',
  nReports: 30,
  search: '',
  owners: [],
  selectedReportIndices: [],
  stability: 'all',
}

const firstOrCurrent = (options: string[] | undefined, current: string): string => {
  if (!options || options.length === 0) return current
  return options.includes(current) ? current : options[0]
}

const Dashboard = () => {
  const [query, setQuery] = usePersistedState<DashboardQuery>('query', INITIAL)
  const filters = useFilters({ env: query.env, branch: query.branch, spec: query.spec })
  const reports = useReports(query)

  // Auto-correct selections when they don't exist in available options
  useEffect(() => {
    if (!filters.data) return
    const corrected = { ...query }
    let changed = false

    const branch = firstOrCurrent(filters.data.branches.available, query.branch)
    if (branch !== query.branch) { corrected.branch = branch; changed = true }

    const spec = firstOrCurrent(filters.data.specs.available, query.spec)
    if (spec !== query.spec) { corrected.spec = spec; changed = true }

    const baseUrl = firstOrCurrent(filters.data.baseUrls.available, query.baseUrl)
    if (baseUrl !== query.baseUrl) { corrected.baseUrl = baseUrl; changed = true }

    if (changed) setQuery(corrected)
  }, [filters.data]) // eslint-disable-line react-hooks/exhaustive-deps

  const allOwnersRef = useRef<Set<string>>(new Set())

  const ownersList = useMemo(() => {
    if (!reports.data) return Array.from(allOwnersRef.current).sort()
    // Only accumulate when no owner filter is active (full dataset)
    if (query.owners.length === 0) {
      allOwnersRef.current = new Set<string>()
      reports.data.rows.forEach((row) => allOwnersRef.current.add(row.owner))
    }
    return Array.from(allOwnersRef.current).sort()
  }, [reports.data, query.owners.length])

  const handleChange = useCallback(
    (changes: Partial<DashboardQuery>) => {
      const next = { ...query, ...changes }
      // Reset child filters when a parent changes
      if ('env' in changes) {
        next.branch = INITIAL.branch
        next.spec = INITIAL.spec
        next.baseUrl = INITIAL.baseUrl
      } else if ('branch' in changes) {
        next.spec = INITIAL.spec
        next.baseUrl = INITIAL.baseUrl
      } else if ('spec' in changes) {
        next.baseUrl = INITIAL.baseUrl
      }
      setQuery(next)
    },
    [query, setQuery],
  )

  const [drawerUrl, setDrawerUrl] = useState<string | null>(null)

  const visibleData = useMemo(() => {
    if (!reports.data) return null
    const indices = query.selectedReportIndices
    if (indices.length === 1 && indices[0] === -1) {
      return { ...reports.data, reports: [], rows: [], totals: { passingTests: 0, failingTests: 0, sumPasses: 0, sumFailures: 0, sumPending: 0, sumSkipped: 0, sumTests: 0, totalReports: 0 } }
    }

    const visibleReports = indices.length === 0 ? reports.data.reports : indices.map((i) => reports.data!.reports[i]).filter(Boolean)
    const allRows = reports.data.rows
      .map((row) => {
        const cells = indices.length === 0 ? row.cells : indices.map((i) => row.cells[i] ?? null)
        const presentCells = cells.filter((c) => c !== null)
        const runs = presentCells.length
        const failures = presentCells.filter((c) => c!.failed).length
        const pendings = presentCells.filter((c) => c!.pending).length
        const skips = presentCells.filter((c) => c!.skipped).length
        const unstableRate = runs > 0 ? Number((((failures + skips) / runs) * 100).toFixed(1)) : 0
        return { ...row, cells, runs, failures, pendings, skips, unstableRate }
      })
      .filter((row) => indices.length === 0 || row.runs > 0)

    // Apply stability filter
    const visibleRows = (query.stability === 'all' ? allRows : allRows.filter((row) => {
      const presentCells = row.cells.filter((c) => c !== null)
      if (presentCells.length === 0) return false
      const isUnstable = row.failures > 0 || row.skips > 0
      return query.stability === 'unstable' ? isUnstable : !isUnstable
    })).sort((a, b) => b.unstableRate - a.unstableRate || a.testName.localeCompare(b.testName))

    // Aggregated: from matrix rows (unique tests)
    // Stable = passed in ALL selected runs, Unstable = failed or skipped in at least one
    let passingTests = 0
    let failingTests = 0
    // Executions: count cells from the same matrix data (consistent with aggregated)
    let sumPasses = 0
    let sumFailures = 0
    let sumPending = 0
    let sumSkipped = 0
    for (const row of visibleRows) {
      const presentCells = row.cells.filter((c) => c !== null)
      if (presentCells.length === 0) continue
      const allPassed = presentCells.every((c) => !c!.failed && !c!.pending && !c!.skipped)
      if (row.failures > 0 || row.skips > 0) failingTests++
      else if (allPassed) passingTests++
      // Count individual cell states for executions
      for (const c of presentCells) {
        if (c!.failed) sumFailures++
        else if (c!.pending) sumPending++
        else if (c!.skipped) sumSkipped++
        else sumPasses++
      }
    }

    return {
      ...reports.data,
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
  }, [reports.data, query.selectedReportIndices, query.stability])

  const handleCellClick = useCallback((reportFilename: string) => {
    const htmlPath = reportFilename.replace(/merged\.json$/, 'index.html')
    setDrawerUrl(`https://pre-bee-test-reports.getbee.info/${htmlPath}`)
  }, [])

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1>E2E Test Failure Matrix</h1>
      </header>

      <aside className={styles.sidebar}>
        <Stats totals={visibleData?.totals} />
        <Filters
          query={query}
          onChange={handleChange}
          filters={filters.data}
          owners={ownersList}
          reports={reports.data?.reports ?? []}
        />
      </aside>

      <section className={styles.content}>
        {reports.error && <ErrorMessage message={reports.error.message} />}
        {reports.isLoading && !reports.data && <Loading />}
        {visibleData && (
          <Matrix
            reports={visibleData.reports}
            rows={visibleData.rows}
            onCellClick={handleCellClick}
          />
        )}
      </section>

      <ReportDrawer url={drawerUrl} onClose={() => setDrawerUrl(null)} />
    </main>
  )
}

export default Dashboard
