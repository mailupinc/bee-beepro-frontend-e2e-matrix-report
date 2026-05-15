'use client'

import MatrixCell from './MatrixCell'
import styles from './MatrixRow.module.scss'
import type { ReportsResponse, TestRow } from '@/lib/types'

type Props = {
  row: TestRow
  reports: ReportsResponse['reports']
  onCellClick?: (reportFilename: string) => void
}

const MatrixRow = ({ row, reports, onCellClick }: Props) => (
  <tr className={styles.row}>
    <td className={`${styles.cell} ${styles.testName}`} title={`${row.testName}\n${row.filePath}`}>
      <span className={styles.title}>{row.testName}</span>
      <span className={styles.file}>{row.filePath}</span>
    </td>
    <td className={`${styles.cell} ${styles.owner}`} title={`Owner: @${row.owner}`}>
      {row.owner === 'unknown' ? 'Unknown' : `@${row.owner}`}
    </td>
    <td className={`${styles.cell} ${styles.rate}`}>{row.unstableRate}%</td>
    {row.cells.map((cell, idx) => (
      <MatrixCell
        key={reports[idx]?.filename ?? idx}
        cell={cell}
        report={reports[idx]}
        onClick={cell && reports[idx] ? () => onCellClick?.(reports[idx].filename) : undefined}
      />
    ))}
  </tr>
)

export default MatrixRow
