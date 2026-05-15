'use client'

import styles from './StatCard.module.scss'

export type Tone = 'success' | 'failure' | 'warning' | 'neutral' | 'pending'

type Props = {
  label: string
  value: number | string
  tone?: Tone
  info?: string
}

const StatCard = ({ label, value, tone = 'neutral', info }: Props) => (
  <div className={styles.card}>
    <span className={`${styles.value} ${styles[tone]}`}>{value}</span>
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
