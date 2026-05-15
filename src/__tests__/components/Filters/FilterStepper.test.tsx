import { render, screen, fireEvent } from '@testing-library/react'
import FilterStepper from '@/components/Filters/FilterStepper'

describe('FilterStepper', () => {
  it('renders label and current value', () => {
    render(<FilterStepper label="Reports" value={15} onChange={() => {}} />)
    expect(screen.getByText('Reports')).toBeInTheDocument()
    expect(screen.getByDisplayValue('15')).toBeInTheDocument()
  })

  it('increments by step on + click', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} step={5} max={100} onChange={onChange} />)
    fireEvent.click(screen.getByText('+'))
    expect(onChange).toHaveBeenCalledWith(15)
  })

  it('decrements by step on − click', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} step={5} min={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('−'))
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('does not go below min', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={3} step={5} min={1} onChange={onChange} />)
    fireEvent.click(screen.getByText('−'))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('does not go above max', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={98} step={5} max={100} onChange={onChange} />)
    fireEvent.click(screen.getByText('+'))
    expect(onChange).toHaveBeenCalledWith(100)
  })

  it('disables − button at min', () => {
    render(<FilterStepper label="N" value={1} min={1} onChange={() => {}} />)
    expect(screen.getByText('−')).toBeDisabled()
  })

  it('disables + button at max', () => {
    render(<FilterStepper label="N" value={100} max={100} onChange={() => {}} />)
    expect(screen.getByText('+')).toBeDisabled()
  })

  it('handles manual input', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} min={1} max={50} onChange={onChange} />)
    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: '25' } })
    expect(onChange).toHaveBeenCalledWith(25)
  })

  it('clamps manual input to max', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} min={1} max={30} onChange={onChange} />)
    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: '999' } })
    expect(onChange).toHaveBeenCalledWith(30)
  })

  it('clamps manual input to min', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} min={5} max={30} onChange={onChange} />)
    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: '2' } })
    expect(onChange).toHaveBeenCalledWith(5)
  })

  it('ignores non-numeric input', () => {
    const onChange = jest.fn()
    render(<FilterStepper label="N" value={10} onChange={onChange} />)
    const input = screen.getByDisplayValue('10')
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()
  })
})
