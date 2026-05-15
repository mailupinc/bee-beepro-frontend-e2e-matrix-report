'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './FilterMultiSelect.module.scss'

type Props = {
  label: string
  values: string[]
  options: string[]
  onChange: (next: string[]) => void
}

const FilterMultiSelect = ({ label, values, options, onChange }: Props) => {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      setOpenUp(spaceBelow < 260)
    }
    setOpen(!open)
  }

  const toggle = (opt: string) => {
    onChange(
      values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt],
    )
  }

  const summary = values.length === 0 ? 'All' : `${values.length} selected`

  return (
    <div className={styles.wrapper} ref={ref}>
      <span className={styles.label}>{label}</span>
      <button type="button" className={styles.trigger} onClick={handleOpen}>
        {summary}
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`${styles.dropdown} ${openUp ? styles.dropdownUp : ''}`}>
          {values.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => onChange([])}>
              Clear all
            </button>
          )}
          <ul className={styles.list}>
            {options.map((opt) => (
              <li key={opt} className={styles.item}>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={values.includes(opt)}
                    onChange={() => toggle(opt)}
                  />
                  <span>@{opt}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default FilterMultiSelect
