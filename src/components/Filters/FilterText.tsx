'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './FilterField.module.scss'

type Props = {
  label: string
  value: string
  placeholder?: string
  onChange: (value: string) => void
  debounceMs?: number
}

const FilterText = ({ label, value, placeholder, onChange, debounceMs = 400 }: Props) => {
  const [local, setLocal] = useState(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLocal(value) }, [value])

  const handleChange = (v: string) => {
    setLocal(v)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => onChange(v), debounceMs)
  }

  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input
        className={styles.control}
        type="text"
        value={local}
        placeholder={placeholder}
        onChange={(event) => handleChange(event.target.value)}
      />
    </label>
  )
}

export default FilterText
