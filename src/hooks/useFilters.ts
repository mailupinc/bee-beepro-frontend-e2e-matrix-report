'use client'

import useSWR from 'swr'
import type { FiltersResponse } from '@/lib/types'

export type FiltersParams = {
  env: string
  branch: string
  spec: string
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json() as Promise<T>
}

const buildFiltersUrl = (params: FiltersParams): string => {
  const searchParams = new URLSearchParams()
  if (params.env) searchParams.set('env', params.env)
  if (params.branch) searchParams.set('branch', params.branch)
  if (params.spec) searchParams.set('spec', params.spec)
  return `/api/filters?${searchParams.toString()}`
}

export const useFilters = (params: FiltersParams) =>
  useSWR<FiltersResponse>(buildFiltersUrl(params), fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
    keepPreviousData: true,
  })

export { fetcher }
