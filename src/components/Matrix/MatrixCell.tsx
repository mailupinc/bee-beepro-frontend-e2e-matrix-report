'use client'

import styles from './MatrixCell.module.scss'
import type { ReportsResponse, TestCell } from '@/lib/types'

type Props = {
  cell: TestCell | null
  report?: ReportsResponse['reports'][number]
  onClick?: () => void
}

const getState = (cell: TestCell) => {
  if (cell.failed) return { cls: 'failure', icon: '✗', label: 'Failed' } as const
  if (cell.skipped) return { cls: 'skipped', icon: '⊘', label: 'Skipped' } as const
  if (cell.pending) return { cls: 'pending', icon: '⏸', label: 'Pending' } as const
  return { cls: 'success', icon: '✓', label: 'Passed' } as const
}

const formatDuration = (ms?: number): string | null => {
  if (ms == null) return null
  return `${Math.round(ms / 1000)}s`
}

const MatrixCell = ({ cell, report, onClick }: Props) => {
  if (!cell) {
    return (
      <td className={`${styles.cell} ${styles.noData}`} title={report ? `Not present in ${report.date} ${report.time}` : ''}>
        –
      </td>
    )
  }
  const { cls, icon, label } = getState(cell)
  const duration = formatDuration(cell.duration)
  return (
    <td
      className={`${styles.cell} ${styles[cls]} ${styles.clickable}`}
      title={report ? `${report.date} ${report.time} · ${label}${duration ? ` · ${duration}` : ''}` : label}
      onClick={onClick}
    >
      {icon}
      {duration && <span className={styles.duration}>{duration}</span>}
    </td>
  )
}

export default MatrixCell
