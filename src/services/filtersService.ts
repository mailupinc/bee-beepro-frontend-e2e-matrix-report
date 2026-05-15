import { TtlCache } from '@/lib/cache'
import { env } from '@/lib/env'
import { buildLevelPrefix, stripSegmentPrefix } from '@/lib/paths'
import { listPrefix } from '@/lib/s3'
import { getAllOwners } from '@/services/suiteOwnersService'
import type { FiltersResponse } from '@/lib/types'

export type FiltersQuery = {
  env?: string
  branch?: string
  spec?: string
}

const segmentCache = new TtlCache<string[]>(env.filtersCacheTtlMs)

const listSegment = async (
  segments: Array<{ key: string; value: string }>,
  nextKey: string,
): Promise<string[]> => {
  const cacheKey = segments.map((s) => `${s.key}=${s.value}`).join('/') + `→${nextKey}`
  return segmentCache.getOrLoad(cacheKey, async () => {
    const prefix = buildLevelPrefix(segments)
    const { commonPrefixes } = await listPrefix(prefix, '/')
    const keyPrefix = `${nextKey}-`
    return commonPrefixes
      .filter((p) => p.startsWith(keyPrefix))
      .map((p) => stripSegmentPrefix(p, nextKey))
      .filter((v) => v.length > 0)
      .sort()
  })
}

const unique = (arrays: string[][]): string[] => [...new Set(arrays.flat())].sort()

const getAllBranches = async (envs: string[]): Promise<string[]> => {
  const results = await Promise.all(
    envs.map((e) => listSegment([{ key: 'env', value: e }], 'branch')),
  )
  return unique(results)
}

const getAllSpecs = async (envs: string[], branches: string[]): Promise<string[]> => {
  const results = await Promise.all(
    envs.flatMap((e) =>
      branches.map((b) =>
        listSegment([{ key: 'env', value: e }, { key: 'branch', value: b }], 'spec'),
      ),
    ),
  )
  return unique(results)
}

const getAllBaseUrls = async (envs: string[], branches: string[], specs: string[]): Promise<string[]> => {
  const results = await Promise.all(
    envs.flatMap((e) =>
      branches.flatMap((b) =>
        specs.map((s) =>
          listSegment(
            [{ key: 'env', value: e }, { key: 'branch', value: b }, { key: 'spec', value: s }],
            'base',
          ),
        ),
      ),
    ),
  )
  return unique(results)
}

export const getFilters = async (query: FiltersQuery): Promise<FiltersResponse> => {
  const envs = await listSegment([], 'env')

  const allBranches = await getAllBranches(envs)
  const availableBranches = query.env
    ? await listSegment([{ key: 'env', value: query.env }], 'branch')
    : allBranches

  const allSpecs = await getAllSpecs(envs, allBranches)
  const availableSpecs =
    query.env && query.branch
      ? await listSegment(
          [{ key: 'env', value: query.env }, { key: 'branch', value: query.branch }],
          'spec',
        )
      : allSpecs

  const allBaseUrls = await getAllBaseUrls(envs, allBranches, allSpecs)
  const availableBaseUrls =
    query.env && query.branch && query.spec
      ? await listSegment(
          [
            { key: 'env', value: query.env },
            { key: 'branch', value: query.branch },
            { key: 'spec', value: query.spec },
          ],
          'base',
        )
      : allBaseUrls

  return {
    envs,
    branches: { all: allBranches, available: availableBranches },
    specs: { all: allSpecs, available: availableSpecs },
    baseUrls: { all: allBaseUrls, available: availableBaseUrls },
    owners: getAllOwners(),
  }
}
