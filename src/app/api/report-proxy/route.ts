import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')
  if (!path) {
    return NextResponse.json({ error: 'Missing path param' }, { status: 400 })
  }

  const baseUrl = process.env.REPORT_BASE_URL ?? 'https://pre-bee-test-reports.getbee.info'
  const url = `${baseUrl}/${path}`

  const res = await fetch(url)
  if (!res.ok) {
    return new NextResponse('Report not found', { status: res.status })
  }

  const html = await res.text()
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
