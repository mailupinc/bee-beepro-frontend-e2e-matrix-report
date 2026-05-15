'use client'

import styles from './FilterStepper.module.scss'

type Props = {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}

const FilterStepper = ({ label, value, min = 1, max = 100, step = 5, onChange }: Props) => {
  const decrement = () => onChange(Math.max(min, value - step))
  const increment = () => onChange(Math.min(max, value + step))
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.target.value, 10)
    if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)))
  }

  return (
    <div className={styles.wrapper}>
      <span className={styles.label}>{label}</span>
      <div className={styles.stepper}>
        <button type="button" className={styles.btn} onClick={decrement} disabled={value <= min}>−</button>
        <input
          type="number"
          className={styles.input}
          value={value}
          min={min}
          max={max}
          onChange={handleInput}
        />
        <button type="button" className={styles.btn} onClick={increment} disabled={value >= max}>+</button>
      </div>
    </div>
  )
}

export default FilterStepper
