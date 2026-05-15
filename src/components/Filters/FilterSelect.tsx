'use client'

import styles from './FilterField.module.scss'

export type Option = { label: string; value: string; disabled?: boolean }

type Props = {
  label: string
  value: string
  options: Option[]
  onChange: (value: string) => void
}

const FilterSelect = ({ label, value, options, onChange }: Props) => (
  <label className={styles.field}>
    <span className={styles.label}>{label}</span>
    <select
      className={styles.control}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}{opt.disabled ? ' (N/A)' : ''}
        </option>
      ))}
    </select>
  </label>
)

export default FilterSelect
