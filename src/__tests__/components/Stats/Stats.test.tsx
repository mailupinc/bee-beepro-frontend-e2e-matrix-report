import { render, screen } from '@testing-library/react'
import Stats from '@/components/Stats/Stats'

describe('Stats', () => {
  const totals = {
    passingTests: 450,
    failingTests: 10,
    sumPasses: 900,
    sumFailures: 20,
    sumPending: 50,
    sumSkipped: 5,
    sumTests: 975,
    totalReports: 2,
  }

  it('renders all stat cards with correct values', () => {
    render(<Stats totals={totals} />)
    expect(screen.getByText('450')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('900')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(screen.getByText('50')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders section labels', () => {
    render(<Stats totals={totals} />)
    expect(screen.getByText('Overall Aggregated Results')).toBeInTheDocument()
    expect(screen.getByText('Executions (2 runs)')).toBeInTheDocument()
  })

  it('does not show run count suffix for 1 report', () => {
    render(<Stats totals={{ ...totals, totalReports: 1 }} />)
    expect(screen.getByText('Executions')).toBeInTheDocument()
    expect(screen.queryByText(/Executions \(/)).not.toBeInTheDocument()
  })

  it('renders zeros when totals is undefined', () => {
    render(<Stats totals={undefined} />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThanOrEqual(5)
  })

  it('shows Total card with sum of Stable + Unstable', () => {
    render(<Stats totals={totals} />)
    expect(screen.getByText('460')).toBeInTheDocument() // 450 + 10
    expect(screen.getByText('Total')).toBeInTheDocument()
  })

  it('renders info tooltips', () => {
    render(<Stats totals={totals} />)
    expect(screen.getByText('Tests that passed in every selected run')).toBeInTheDocument()
    expect(screen.getByText('Tests that failed or were skipped in at least one run')).toBeInTheDocument()
  })
})
