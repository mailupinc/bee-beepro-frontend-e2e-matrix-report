'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './ReportPicker.module.scss'

type Report = { filename: string; date: string; time: string }

type Props = {
  reports: Report[]
  selectedIndices: number[]
  onChange: (indices: number[]) => void
}

const QUICK_OPTIONS = [5, 10, 15, 20, 25, 30]

const ReportPicker = ({ reports, selectedIndices, onChange }: Props) => {
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
      setOpenUp(spaceBelow < 340)
    }
    setOpen(!open)
  }

  const allSelected = selectedIndices.length === 0
  const noneSelected = selectedIndices.length === 1 && selectedIndices[0] === -1
  const activeQuick = (!noneSelected && !allSelected) ? QUICK_OPTIONS.find((n) => {
    if (selectedIndices.length !== Math.min(n, reports.length)) return false
    return selectedIndices.every((idx) => idx < n)
  }) : undefined

  const handleQuick = (n: number) => {
    const indices = Array.from({ length: Math.min(n, reports.length) }, (_, i) => i)
    onChange(indices)
  }

  const toggleIndex = (idx: number) => {
    if (noneSelected) {
      onChange([idx])
      return
    }
    if (selectedIndices.includes(idx)) {
      const next = selectedIndices.filter((i) => i !== idx)
      onChange(next.length === 0 ? [-1] : next)
    } else {
      onChange([...selectedIndices, idx].sort((a, b) => a - b))
    }
  }

  const selectAll = () => onChange([])
  const selectNone = () => onChange([-1])

  const summary = noneSelected
    ? 'None'
    : allSelected
      ? `All (${reports.length})`
      : activeQuick
        ? `Last ${activeQuick}`
        : `${selectedIndices.length} selected`

  return (
    <div className={styles.wrapper} ref={ref}>
      <span className={styles.label}>Reports</span>
      <button type="button" className={styles.trigger} onClick={handleOpen}>
        {summary}
        <span className={styles.chevron}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className={`${styles.dropdown} ${openUp ? styles.dropdownUp : ''}`}>
          <div className={styles.quickSection}>
            <button
              type="button"
              className={`${styles.quickBtn} ${allSelected ? styles.active : ''}`}
              onClick={selectAll}
            >
              All
            </button>
            {QUICK_OPTIONS.filter((n) => n <= reports.length).map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.quickBtn} ${activeQuick === n ? styles.active : ''}`}
                onClick={() => handleQuick(n)}
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              className={`${styles.quickBtn} ${noneSelected ? styles.active : ''}`}
              onClick={selectNone}
            >
              None
            </button>
          </div>
          <ul className={styles.list}>
            {reports.map((report, idx) => (
              <li key={report.filename} className={styles.item}>
                <label className={styles.option}>
                  <input
                    type="checkbox"
                    checked={!noneSelected && (allSelected || selectedIndices.includes(idx))}
                    onChange={() => {
                      if (allSelected) {
                        // Switching from "all" to individual: select all except this one
                        const all = Array.from({ length: reports.length }, (_, i) => i)
                        onChange(all.filter((i) => i !== idx))
                      } else {
                        toggleIndex(idx)
                      }
                    }}
                  />
                  <span className={styles.date}>{report.date}</span>
                  <span className={styles.time}>{report.time}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ReportPicker
