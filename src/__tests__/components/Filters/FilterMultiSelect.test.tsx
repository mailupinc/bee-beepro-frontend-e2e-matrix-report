import { render, screen, fireEvent } from '@testing-library/react'
import FilterMultiSelect from '@/components/Filters/FilterMultiSelect'

describe('FilterMultiSelect', () => {
  const options = ['alice', 'bob', 'charlie']

  it('renders label', () => {
    render(<FilterMultiSelect label="Owners" values={[]} options={options} onChange={() => {}} />)
    expect(screen.getByText('Owners')).toBeInTheDocument()
  })

  it('shows "All" when no values selected', () => {
    render(<FilterMultiSelect label="Owners" values={[]} options={options} onChange={() => {}} />)
    expect(screen.getByText('All')).toBeInTheDocument()
  })

  it('shows count when values selected', () => {
    render(<FilterMultiSelect label="Owners" values={['alice', 'bob']} options={options} onChange={() => {}} />)
    expect(screen.getByText('2 selected')).toBeInTheDocument()
  })

  it('opens dropdown on click', () => {
    render(<FilterMultiSelect label="Owners" values={[]} options={options} onChange={() => {}} />)
    fireEvent.click(screen.getByText('All'))
    expect(screen.getByText('@alice')).toBeInTheDocument()
    expect(screen.getByText('@bob')).toBeInTheDocument()
    expect(screen.getByText('@charlie')).toBeInTheDocument()
  })

  it('toggles option on checkbox click', () => {
    const onChange = jest.fn()
    render(<FilterMultiSelect label="Owners" values={['alice']} options={options} onChange={onChange} />)
    fireEvent.click(screen.getByText('1 selected'))
    const bobCheckbox = screen.getByText('@bob').parentElement?.querySelector('input')!
    fireEvent.click(bobCheckbox)
    expect(onChange).toHaveBeenCalledWith(['alice', 'bob'])
  })

  it('removes option when already selected', () => {
    const onChange = jest.fn()
    render(<FilterMultiSelect label="Owners" values={['alice', 'bob']} options={options} onChange={onChange} />)
    fireEvent.click(screen.getByText('2 selected'))
    const aliceCheckbox = screen.getByText('@alice').parentElement?.querySelector('input')!
    fireEvent.click(aliceCheckbox)
    expect(onChange).toHaveBeenCalledWith(['bob'])
  })

  it('shows "Clear all" button when values are selected', () => {
    const onChange = jest.fn()
    render(<FilterMultiSelect label="Owners" values={['alice']} options={options} onChange={onChange} />)
    fireEvent.click(screen.getByText('1 selected'))
    fireEvent.click(screen.getByText('Clear all'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('closes dropdown on outside click', () => {
    render(<FilterMultiSelect label="Owners" values={[]} options={options} onChange={() => {}} />)
    fireEvent.click(screen.getByText('All'))
    expect(screen.getByText('@alice')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('@alice')).not.toBeInTheDocument()
  })
})
