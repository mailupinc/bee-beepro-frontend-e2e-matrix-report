import { render, screen } from '@testing-library/react'
import ErrorMessage from '@/components/ErrorMessage/ErrorMessage'

describe('ErrorMessage', () => {
  it('renders error heading', () => {
    render(<ErrorMessage message="Something went wrong" />)
    expect(screen.getByText('⚠️ Error')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(<ErrorMessage message="Network timeout" />)
    expect(screen.getByText('Network timeout')).toBeInTheDocument()
  })
})
