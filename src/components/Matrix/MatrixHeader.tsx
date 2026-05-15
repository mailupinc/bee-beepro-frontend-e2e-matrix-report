'use client'

import styles from './MatrixHeader.module.scss'
import type { ReportsResponse } from '@/lib/types'

type Props = { reports: ReportsResponse['reports'] }

const MatrixHeader = ({ reports }: Props) => (
  <thead>
    <tr>
      <th className={`${styles.cell} ${styles.testName}`}>Test</th>
      <th className={`${styles.cell} ${styles.owner}`}>Owner</th>
      <th className={`${styles.cell} ${styles.rate}`}>Unstable Rate</th>
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
