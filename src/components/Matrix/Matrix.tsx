'use client'

import { useMemo, useState } from 'react'
import MatrixHeader from './MatrixHeader'
import type { SortKey, SortDir } from './MatrixHeader'
import MatrixRow from './MatrixRow'
import styles from './Matrix.module.scss'
import type { ReportsResponse, TestRow } from '@/lib/types'

type Props = {
  reports: ReportsResponse['reports']
  rows: TestRow[]
  onCellClick?: (reportFilename: string) => void
}

const getAvgDuration = (row: TestRow): number => {
  const durations = row.cells.filter((c) => c?.duration != null).map((c) => c!.duration!)
  if (durations.length === 0) return 0
  return durations.reduce((a, b) => a + b, 0) / durations.length
}

const Matrix = ({ reports, rows, onCellClick }: Props) => {
  const [collapsed, setCollapsed] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('unstableRate')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'testName' || key === 'owner' ? 'asc' : 'desc')
    }
  }

  const sortedRows = useMemo(() => {
    const sorted = [...rows]
    sorted.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'testName':
          cmp = a.testName.localeCompare(b.testName)
          break
        case 'owner':
          cmp = a.owner.localeCompare(b.owner)
          break
        case 'unstableRate':
          cmp = a.unstableRate - b.unstableRate
          break
        case 'avgTime':
          cmp = getAvgDuration(a) - getAvgDuration(b)
          break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [rows, sortKey, sortDir])

  if (rows.length === 0) {
    return <p className={styles.empty}>No tests match the current filters.</p>
  }

  return (
    <div className={styles.container}>
      <table
        className={styles.table}
        style={{
          '--test-col-min': collapsed ? '180px' : '600px',
          '--test-col-max': collapsed ? '180px' : 'none',
        } as React.CSSProperties}
      >
        <MatrixHeader
          reports={reports}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
        <tbody>
          {sortedRows.map((row) => (
            <MatrixRow key={`${row.filePath}::${row.testName}`} row={row} reports={reports} onCellClick={onCellClick} />
          ))}
        </tbody>
      </table>
      <div className={styles.footer}>
        <span>{rows.length} tests · {reports.length} reports</span>
      </div>
    </div>
  )
}

export default Matrix
