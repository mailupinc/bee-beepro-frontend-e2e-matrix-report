import { buildBasePrefix, buildLevelPrefix, parseMergedKey, stripSegmentPrefix, DEFAULTS } from '@/lib/paths'

jest.mock('@/lib/env', () => ({
  env: { rootPrefix: () => 'bee-beepro-frontend-e2e' },
}))

describe('paths', () => {
  describe('DEFAULTS', () => {
    it('has expected default values', () => {
      expect(DEFAULTS).toEqual({
        branch: 'main',
        env: 'qa',
        spec: 'all',
        baseUrl: 'default',
        nReports: 15,
      })
    })
  })

  describe('buildBasePrefix', () => {
    it('builds a full S3 prefix from parts', () => {
      const result = buildBasePrefix({ env: 'qa', branch: 'main', spec: 'all', baseUrl: 'default' })
      expect(result).toBe('bee-beepro-frontend-e2e/env-qa/branch-main/spec-all/base-default/')
    })

    it('handles custom values', () => {
      const result = buildBasePrefix({ env: 'staging', branch: 'feat-x', spec: 'smoke', baseUrl: 'custom' })
      expect(result).toBe('bee-beepro-frontend-e2e/env-staging/branch-feat-x/spec-smoke/base-custom/')
    })
  })

  describe('buildLevelPrefix', () => {
    it('builds prefix from empty segments (root)', () => {
      const result = buildLevelPrefix([])
      expect(result).toBe('bee-beepro-frontend-e2e/')
    })

    it('builds prefix from one segment', () => {
      const result = buildLevelPrefix([{ key: 'env', value: 'qa' }])
      expect(result).toBe('bee-beepro-frontend-e2e/env-qa/')
    })

    it('builds prefix from multiple segments', () => {
      const result = buildLevelPrefix([
        { key: 'env', value: 'qa' },
        { key: 'branch', value: 'main' },
      ])
      expect(result).toBe('bee-beepro-frontend-e2e/env-qa/branch-main/')
    })
  })

  describe('parseMergedKey', () => {
    it('parses a valid merged.json key', () => {
      const key = 'bee-beepro-frontend-e2e/env-qa/branch-main/spec-all/base-default/2026-05-14/09-22-47/merged.json'
      expect(parseMergedKey(key)).toEqual({ date: '2026-05-14', time: '09-22-47' })
    })

    it('returns null for non-merged key', () => {
      expect(parseMergedKey('something/else/report.json')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(parseMergedKey('')).toBeNull()
    })

    it('returns null if date format is wrong', () => {
      expect(parseMergedKey('path/2026-5-1/09-22-47/merged.json')).toBeNull()
    })
  })

  describe('stripSegmentPrefix', () => {
    it('strips the key prefix and trailing slash', () => {
      expect(stripSegmentPrefix('env-qa/', 'env')).toBe('qa')
    })

    it('handles branch prefix', () => {
      expect(stripSegmentPrefix('branch-main/', 'branch')).toBe('main')
    })

    it('handles spec prefix', () => {
      expect(stripSegmentPrefix('spec-all/', 'spec')).toBe('all')
    })

    it('handles base prefix with hyphenated value', () => {
      expect(stripSegmentPrefix('base-my-custom-url/', 'base')).toBe('my-custom-url')
    })
  })
})
