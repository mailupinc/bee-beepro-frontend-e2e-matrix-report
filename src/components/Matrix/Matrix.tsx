'use client'

import { useState } from 'react'
import MatrixHeader from './MatrixHeader'
import MatrixRow from './MatrixRow'
import styles from './Matrix.module.scss'
import type { ReportsResponse, TestRow } from '@/lib/types'

type Props = {
  reports: ReportsResponse['reports']
  rows: TestRow[]
  onCellClick?: (reportFilename: string) => void
}

const Matrix = ({ reports, rows, onCellClick }: Props) => {
  const [collapsed, setCollapsed] = useState(false)

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
        <MatrixHeader reports={reports} collapsed={collapsed} onToggleCollapse={() => setCollapsed((v) => !v)} />
        <tbody>
          {rows.map((row) => (
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
