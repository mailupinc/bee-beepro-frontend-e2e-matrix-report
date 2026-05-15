import { NextRequest, NextResponse } from 'next/server'
import { getFilters } from '@/services/filtersService'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const filters = await getFilters({
      env: searchParams.get('env') ?? undefined,
      branch: searchParams.get('branch') ?? undefined,
      spec: searchParams.get('spec') ?? undefined,
    })
    return NextResponse.json(filters, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=60' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
