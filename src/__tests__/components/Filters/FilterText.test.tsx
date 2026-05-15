import { render, screen, fireEvent, act } from '@testing-library/react'
import FilterText from '@/components/Filters/FilterText'

describe('FilterText', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('renders label and input', () => {
    render(<FilterText label="Search" value="" onChange={() => {}} />)
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows current value', () => {
    render(<FilterText label="Search" value="hello" onChange={() => {}} />)
    expect(screen.getByDisplayValue('hello')).toBeInTheDocument()
  })

  it('shows placeholder', () => {
    render(<FilterText label="Search" value="" placeholder="Type here..." onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
  })

  it('debounces onChange calls', () => {
    const onChange = jest.fn()
    render(<FilterText label="Search" value="" onChange={onChange} debounceMs={300} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })
    expect(onChange).not.toHaveBeenCalled()
    act(() => { jest.advanceTimersByTime(300) })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('abc')
  })

  it('updates local value immediately while debouncing', () => {
    const onChange = jest.fn()
    render(<FilterText label="Search" value="" onChange={onChange} debounceMs={400} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(screen.getByDisplayValue('test')).toBeInTheDocument()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('syncs local value when prop changes', () => {
    const { rerender } = render(<FilterText label="Search" value="old" onChange={() => {}} />)
    rerender(<FilterText label="Search" value="new" onChange={() => {}} />)
    expect(screen.getByDisplayValue('new')).toBeInTheDocument()
  })
})
