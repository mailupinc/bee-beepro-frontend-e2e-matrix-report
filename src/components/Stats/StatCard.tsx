'use client'

import styles from './StatCard.module.scss'

export type Tone = 'success' | 'failure' | 'warning' | 'neutral' | 'pending'

type Props = {
  label: string
  value: number | string
  pct?: string
  tone?: Tone
  info?: string
}

const StatCard = ({ label, value, pct, tone = 'neutral', info }: Props) => (
  <div className={styles.card}>
    <span className={`${styles.value} ${styles[tone]}`}>
      {value}
      {pct && <span className={styles.pct}>{pct}</span>}
    </span>
    <span className={styles.label}>
      {label}
      {info && (
        <span className={styles.infoWrap}>
          <span className={styles.infoIcon}>ⓘ</span>
          <span className={styles.tooltip}>{info}</span>
        </span>
      )}
    </span>
  </div>
)

export default StatCard
