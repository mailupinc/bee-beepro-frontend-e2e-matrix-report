const required = (name: string): string => {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env = {
  awsRegion: process.env.AWS_REGION ?? 'eu-west-1',
  bucket: () => required('REPORTS_S3_BUCKET'),
  rootPrefix: () => (process.env.REPORTS_S3_ROOT_PREFIX ?? 'bee-beepro-frontend-e2e').replace(/\/+$/, ''),
  filtersCacheTtlMs: Number(process.env.FILTERS_CACHE_TTL_MS ?? 60_000),
  manifestCacheTtlMs: Number(process.env.MANIFEST_CACHE_TTL_MS ?? 60_000),
}
