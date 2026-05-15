'use client'

import { useState } from 'react'
import FilterSelect from './FilterSelect'
import type { Option } from './FilterSelect'
import FilterText from './FilterText'
import FilterMultiSelect from './FilterMultiSelect'
import ReportPicker from './ReportPicker'
import styles from './Filters.module.scss'
import type { DashboardQuery } from '@/hooks/useReports'
import type { FilterLevel, FiltersResponse } from '@/lib/types'

type Report = { filename: string; date: string; time: string }

type Props = {
  query: DashboardQuery
  onChange: (changes: Partial<DashboardQuery>) => void
  onReset: () => void
  filters?: FiltersResponse
  owners: string[]
  reports: Report[]
}

const toLevelOptions = (level: FilterLevel | undefined, fallback: string): Option[] => {
  const all = level?.all ?? [fallback]
  const available = new Set(level?.available ?? all)
  const values = Array.from(new Set([fallback, ...all]))
  return values.map((v) => ({ label: v, value: v, disabled: !available.has(v) }))
}

const toSimpleOptions = (values: string[] | undefined, fallback: string): Option[] =>
  Array.from(new Set([fallback, ...(values ?? [])])).map((v) => ({ label: v, value: v }))

const Filters = ({ query, onChange, onReset, filters, owners, reports }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  return (
    <div className={styles.filters}>
      <div className={styles.header}>
        <span className={styles.title}>Filters</span>
        <button type="button" className={styles.resetBtn} onClick={onReset}>
          Reset
        </button>
      </div>
      <FilterText
        label="Search"
        placeholder="Filter by test name…"
        value={query.search}
        onChange={(search) => onChange({ search })}
      />
      <FilterSelect
        label="Stability"
        value={query.stability}
        options={[
          { label: 'All', value: 'all' },
          { label: 'Stable', value: 'stable' },
          { label: 'Unstable', value: 'unstable' },
        ]}
        onChange={(stability) => onChange({ stability: stability as 'all' | 'stable' | 'unstable' })}
      />
      <ReportPicker
        reports={reports}
        selectedIndices={query.selectedReportIndices}
        onChange={(indices) => onChange({ selectedReportIndices: indices })}
      />
      <FilterMultiSelect
        label="Owners"
        values={query.owners}
        options={owners}
        onChange={(next) => onChange({ owners: next })}
      />
      <button
        type="button"
        className={styles.advancedToggle}
        onClick={() => setShowAdvanced((v) => !v)}
      >
        {showAdvanced ? '▾ Hide advanced filters' : '▸ Advanced filters'}
      </button>
      {showAdvanced && (
        <div className={styles.advancedSection}>
          <FilterSelect
            label="Env"
            value={query.env}
            options={toSimpleOptions(filters?.envs, 'qa')}
            onChange={(env) => onChange({ env })}
          />
          <FilterSelect
            label="Branch"
            value={query.branch}
            options={toLevelOptions(filters?.branches, 'main')}
            onChange={(branch) => onChange({ branch })}
          />
          <FilterSelect
            label="Spec"
            value={query.spec}
            options={toLevelOptions(filters?.specs, 'all')}
            onChange={(spec) => onChange({ spec })}
          />
          <FilterSelect
            label="Base URL"
            value={query.baseUrl}
            options={toLevelOptions(filters?.baseUrls, 'default')}
            onChange={(baseUrl) => onChange({ baseUrl })}
          />
        </div>
      )}
    </div>
  )
}

export default Filters
