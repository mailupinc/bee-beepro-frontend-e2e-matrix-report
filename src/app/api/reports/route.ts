import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULTS } from '@/lib/paths'
import { getReports } from '@/services/reportsService'
import type { ReportsQuery } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseQuery = (request: NextRequest): ReportsQuery => {
  const sp = request.nextUrl.searchParams

  const ownersRaw = sp.get('owners')?.trim()
  const owners =
    !ownersRaw || ownersRaw === 'all'
      ? null
      : ownersRaw
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)

  const searchRaw = sp.get('search')?.trim()
  const search = !searchRaw || searchRaw === 'all' ? null : searchRaw

  const nRaw = Number(sp.get('n_reports'))
  const nReports = Number.isFinite(nRaw) && nRaw > 0 ? Math.floor(nRaw) : DEFAULTS.nReports

  return {
    branch: sp.get('branch')?.trim() || DEFAULTS.branch,
    env: sp.get('env')?.trim() || DEFAULTS.env,
    spec: sp.get('spec')?.trim() || DEFAULTS.spec,
    baseUrl: sp.get('base_url')?.trim() || DEFAULTS.baseUrl,
    nReports,
    search,
    owners,
  }
}

export async function GET(request: NextRequest) {
  try {
    const query = parseQuery(request)
    const data = await getReports(query)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
