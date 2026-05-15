'use client'

import useSWR from 'swr'
import { fetcher } from './useFilters'
import type { ReportsResponse } from '@/lib/types'

export type DashboardQuery = {
  branch: string
  env: string
  spec: string
  baseUrl: string
  nReports: number
  search: string
  owners: string[]
  selectedReportIndices: number[]
  stability: 'all' | 'stable' | 'unstable'
}

const MAX_REPORTS = 30

const buildUrl = (q: DashboardQuery): string => {
  const params = new URLSearchParams({
    branch: q.branch,
    env: q.env,
    spec: q.spec,
    base_url: q.baseUrl,
    n_reports: String(MAX_REPORTS),
  })
  if (q.search.trim()) params.set('search', q.search.trim())
  if (q.owners.length > 0) params.set('owners', q.owners.join(','))
  return `/api/reports?${params.toString()}`
}

export const useReports = (query: DashboardQuery) =>
  useSWR<ReportsResponse>(buildUrl(query), fetcher, {
    revalidateOnFocus: false,
    keepPreviousData: true,
  })
