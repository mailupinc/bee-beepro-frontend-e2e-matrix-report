import { render, screen } from '@testing-library/react'
import StatCard from '@/components/Stats/StatCard'

describe('StatCard', () => {
  it('renders value and label', () => {
    render(<StatCard label="Stable" value={42} />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('Stable')).toBeInTheDocument()
  })

  it('renders string values', () => {
    render(<StatCard label="Rate" value="99%" />)
    expect(screen.getByText('99%')).toBeInTheDocument()
  })

  it('renders with success tone class', () => {
    const { container } = render(<StatCard label="Pass" value={10} tone="success" />)
    expect(container.querySelector('.success')).toBeInTheDocument()
  })

  it('renders with failure tone class', () => {
    const { container } = render(<StatCard label="Fail" value={5} tone="failure" />)
    expect(container.querySelector('.failure')).toBeInTheDocument()
  })

  it('defaults to neutral tone', () => {
    const { container } = render(<StatCard label="X" value={0} />)
    expect(container.querySelector('.neutral')).toBeInTheDocument()
  })

  it('shows info tooltip when info prop is provided', () => {
    render(<StatCard label="Stable" value={1} info="This is a tooltip" />)
    expect(screen.getByText('ⓘ')).toBeInTheDocument()
    expect(screen.getByText('This is a tooltip')).toBeInTheDocument()
  })

  it('does not render info icon when info prop is not provided', () => {
    render(<StatCard label="Stable" value={1} />)
    expect(screen.queryByText('ⓘ')).not.toBeInTheDocument()
  })
})
