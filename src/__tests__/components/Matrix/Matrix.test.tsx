import { render, screen } from '@testing-library/react'
import Matrix from '@/components/Matrix/Matrix'
import { makeReport, makeRow } from '../../fixtures'

describe('Matrix', () => {
  const reports = [makeReport(0), makeReport(1)]

  it('renders empty message when no rows', () => {
    render(<Matrix reports={reports} rows={[]} />)
    expect(screen.getByText('No tests match the current filters.')).toBeInTheDocument()
  })

  it('renders rows when provided', () => {
    const rows = [
      makeRow({ testName: 'Test A', filePath: 'a.cy.ts', cells: [null, null] }),
      makeRow({ testName: 'Test B', filePath: 'b.cy.ts', cells: [null, null] }),
    ]
    render(<Matrix reports={reports} rows={rows} />)
    expect(screen.getByText('Test A')).toBeInTheDocument()
    expect(screen.getByText('Test B')).toBeInTheDocument()
  })

  it('renders footer with correct counts', () => {
    const rows = [makeRow({ cells: [null, null] })]
    render(<Matrix reports={reports} rows={rows} />)
    expect(screen.getByText('1 tests · 2 reports')).toBeInTheDocument()
  })

  it('uses filePath::testName as unique key (no React warnings)', () => {
    // Two rows with same testName but different filePath
    const rows = [
      makeRow({ testName: 'Same Name', filePath: 'a/test.cy.ts', cells: [null, null] }),
      makeRow({ testName: 'Same Name', filePath: 'b/test.cy.ts', cells: [null, null] }),
    ]
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    render(<Matrix reports={reports} rows={rows} />)
    const keyWarnings = consoleSpy.mock.calls.filter((call) =>
      call.some((arg) => typeof arg === 'string' && arg.includes('same key')),
    )
    expect(keyWarnings).toHaveLength(0)
    consoleSpy.mockRestore()
  })

  it('propagates onCellClick', () => {
    const onCellClick = jest.fn()
    const rows = [makeRow({ testName: 'X', filePath: 'x.cy.ts', cells: [{ failed: true, pending: false, skipped: false }, null] })]
    const { container } = render(<Matrix reports={reports} rows={rows} onCellClick={onCellClick} />)
    // Find the failed cell and click it
    const failedCell = container.querySelector('.failure')
    failedCell?.click()
    expect(onCellClick).toHaveBeenCalledWith(reports[0].filename)
  })
})
