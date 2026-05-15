'use client'

import styles from './MatrixHeader.module.scss'
import type { ReportsResponse } from '@/lib/types'

export type SortKey = 'testName' | 'owner' | 'unstableRate' | 'avgTime'
export type SortDir = 'asc' | 'desc'

type Props = {
  reports: ReportsResponse['reports']
  collapsed: boolean
  onToggleCollapse: () => void
  sortKey: SortKey
  sortDir: SortDir
  onSort: (key: SortKey) => void
}

const SortIndicator = ({ active, dir }: { active: boolean; dir: SortDir }) => {
  if (!active) return <span className={styles.sortIcon}>⇅</span>
  return <span className={styles.sortIconActive}>{dir === 'asc' ? '▲' : '▼'}</span>
}

const MatrixHeader = ({ reports, collapsed, onToggleCollapse, sortKey, sortDir, onSort }: Props) => (
  <thead>
    <tr>
      <th className={`${styles.cell} ${styles.testName}`}>
        <span className={styles.testNameInner}>
          <button type="button" className={styles.sortBtn} onClick={() => onSort('testName')}>
            Test <SortIndicator active={sortKey === 'testName'} dir={sortDir} />
          </button>
          <button
            className={styles.collapseBtn}
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand test column' : 'Collapse test column'}
            aria-label={collapsed ? 'Expand test column' : 'Collapse test column'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </span>
      </th>
      <th className={`${styles.cell} ${styles.owner}`}>
        <button type="button" className={styles.sortBtn} onClick={() => onSort('owner')}>
          Owner <SortIndicator active={sortKey === 'owner'} dir={sortDir} />
        </button>
      </th>
      <th className={`${styles.cell} ${styles.rate}`}>
        <button type="button" className={styles.sortBtn} onClick={() => onSort('unstableRate')}>
          Unstable Rate <SortIndicator active={sortKey === 'unstableRate'} dir={sortDir} />
        </button>
      </th>
      <th className={`${styles.cell} ${styles.avgTime}`}>
        <button type="button" className={styles.sortBtn} onClick={() => onSort('avgTime')}>
          Avg Time <SortIndicator active={sortKey === 'avgTime'} dir={sortDir} />
        </button>
      </th>
      {reports.map((report) => (
        <th key={report.filename} className={`${styles.cell} ${styles.date}`} title={report.filename}>
          <span className={styles.datePart}>{report.date}</span>
          <span className={styles.timePart}>{report.time.replace(/-/g, ':').slice(0, 5)}</span>
        </th>
      ))}
    </tr>
  </thead>
)

export default MatrixHeader
