'use client'

import MatrixCell from './MatrixCell'
import styles from './MatrixRow.module.scss'
import type { ReportsResponse, TestRow } from '@/lib/types'

type Props = {
  row: TestRow
  reports: ReportsResponse['reports']
  onCellClick?: (reportFilename: string) => void
}

const formatAvgDuration = (cells: TestRow['cells']): string => {
  const durations = cells.filter((c) => c?.duration != null).map((c) => c!.duration!)
  if (durations.length === 0) return '–'
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  return `${Math.round(avg / 1000)}s`
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
    <td className={`${styles.cell} ${styles.avgTime}`}>{formatAvgDuration(row.cells)}</td>
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
