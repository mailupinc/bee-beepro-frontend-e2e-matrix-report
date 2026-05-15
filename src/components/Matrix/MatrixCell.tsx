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

const MatrixCell = ({ cell, report, onClick }: Props) => {
  if (!cell) {
    return (
      <td className={`${styles.cell} ${styles.noData}`} title={report ? `Not present in ${report.date} ${report.time}` : ''}>
        –
      </td>
    )
  }
  const { cls, icon, label } = getState(cell)
  return (
    <td
      className={`${styles.cell} ${styles[cls]} ${styles.clickable}`}
      title={report ? `${report.date} ${report.time} · ${label}` : label}
      onClick={onClick}
    >
      {icon}
    </td>
  )
}

export default MatrixCell
