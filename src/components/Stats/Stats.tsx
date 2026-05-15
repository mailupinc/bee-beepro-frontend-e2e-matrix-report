'use client'

import StatCard from './StatCard'
import styles from './Stats.module.scss'
import type { ReportsResponse } from '@/lib/types'

type Props = { totals?: ReportsResponse['totals'] }

const Stats = ({ totals }: Props) => {
  const stable = totals?.passingTests ?? 0
  const unstable = totals?.failingTests ?? 0
  const total = stable + unstable
  const sumPasses = totals?.sumPasses ?? 0
  const sumFailures = totals?.sumFailures ?? 0
  const sumPending = totals?.sumPending ?? 0
  const sumSkipped = totals?.sumSkipped ?? 0
  const nReports = totals?.totalReports ?? 0

  return (
    <div className={styles.stats}>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Overall Aggregated Results</span>
        <div className={styles.sectionCards}>
          <StatCard label="Total" value={total} tone="neutral" info="Total unique tests in the selected runs" />
          <StatCard label="Stable" value={stable} tone={stable > 0 ? 'success' : 'neutral'} info="Tests that passed in every selected run" />
          <StatCard label="Unstable" value={unstable} tone={unstable > 0 ? 'failure' : 'neutral'} info="Tests that failed or were skipped in at least one run" />
        </div>
      </div>
      <div className={styles.section}>
        <span className={styles.sectionLabel}>Executions{nReports > 1 ? ` (${nReports} runs)` : ''}</span>
        <div className={styles.sectionCards}>
          <StatCard label="Pass" value={sumPasses} tone={sumPasses > 0 ? 'success' : 'neutral'} info="Sum of passed executions across all selected runs" />
          <StatCard label="Fail" value={sumFailures} tone={sumFailures > 0 ? 'failure' : 'neutral'} info="Sum of failed executions across all selected runs" />
          <StatCard label="Pending" value={sumPending} tone="pending" info="Tests explicitly skipped via it.skip() — sum across runs" />
          <StatCard label="Skipped" value={sumSkipped} tone="pending" info="Tests that didn't run because a previous test/hook failed — sum across runs" />
        </div>
      </div>
    </div>
  )
}

export default Stats
