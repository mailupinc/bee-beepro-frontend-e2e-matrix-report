import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { env } from './env'

let client: S3Client | null = null

export const getS3 = (): S3Client => {
  if (!client) {
    client = new S3Client({ region: env.awsRegion })
  }
  return client
}

export type ListResult = {
  commonPrefixes: string[]
  keys: string[]
}

export const listPrefix = async (prefix: string, delimiter = '/'): Promise<ListResult> => {
  const s3 = getS3()
  const commonPrefixes: string[] = []
  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await s3.send(
      new ListObjectsV2Command({
        Bucket: env.bucket(),
        Prefix: prefix,
        Delimiter: delimiter,
        ContinuationToken: continuationToken,
      }),
    )

    response.CommonPrefixes?.forEach((p) => {
      if (p.Prefix) commonPrefixes.push(p.Prefix.slice(prefix.length))
    })
    response.Contents?.forEach((o) => {
      if (o.Key) keys.push(o.Key)
    })

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return { commonPrefixes, keys }
}

export const listAllKeys = async (prefix: string): Promise<string[]> => {
  const { keys } = await listPrefix(prefix, '')
  return keys
}

export const getJson = async <T>(key: string): Promise<T> => {
  const s3 = getS3()
  const response = await s3.send(new GetObjectCommand({ Bucket: env.bucket(), Key: key }))
  const body = await response.Body?.transformToString('utf-8')
  if (!body) throw new Error(`Empty body for S3 object: ${key}`)
  return JSON.parse(body) as T
}
