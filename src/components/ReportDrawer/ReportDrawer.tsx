'use client'

import { useEffect } from 'react'
import styles from './ReportDrawer.module.scss'

type Props = {
  url: string | null
  onClose: () => void
}

const ReportDrawer = ({ url, onClose }: Props) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (url) document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [url, onClose])

  if (!url) return null

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <aside className={styles.drawer}>
        <header className={styles.header}>
          <a href={url} target="_blank" rel="noopener noreferrer" className={styles.link}>
            Open in new tab ↗
          </a>
          <button className={styles.close} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <iframe src={url} className={styles.iframe} title="Mochawesome Report" />
      </aside>
    </>
  )
}

export default ReportDrawer
