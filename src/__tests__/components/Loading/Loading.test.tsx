import { render, screen } from '@testing-library/react'
import Loading from '@/components/Loading/Loading'

describe('Loading', () => {
  it('renders loading text', () => {
    render(<Loading />)
    expect(screen.getByText(/Loading test data/)).toBeInTheDocument()
  })
})
