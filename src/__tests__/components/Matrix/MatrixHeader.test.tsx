import { render, screen } from '@testing-library/react'
import MatrixHeader from '@/components/Matrix/MatrixHeader'
import { makeReport } from '../../fixtures'

describe('MatrixHeader', () => {
  it('renders fixed column headers', () => {
    render(<table><MatrixHeader reports={[]} /></table>)
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Failure Rate')).toBeInTheDocument()
  })

  it('renders a header for each report', () => {
    const reports = [makeReport(0), makeReport(1), makeReport(2)]
    const { container } = render(<table><MatrixHeader reports={reports} /></table>)
    const ths = container.querySelectorAll('th')
    // 3 fixed + 3 reports
    expect(ths.length).toBe(6)
  })

  it('displays formatted time (HH:MM)', () => {
    const reports = [{ filename: 'x/merged.json', date: '2026-05-01', time: '14-35-22', stats: { passes: 0, failures: 0, pending: 0, skipped: 0, tests: 0 } }]
    render(<table><MatrixHeader reports={reports} /></table>)
    expect(screen.getByText('14:35')).toBeInTheDocument()
  })

  it('displays the date', () => {
    const reports = [makeReport(0)]
    render(<table><MatrixHeader reports={reports} /></table>)
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
  })
})
