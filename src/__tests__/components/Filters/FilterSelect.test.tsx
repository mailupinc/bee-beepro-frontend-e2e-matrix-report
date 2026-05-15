import { render, screen, fireEvent } from '@testing-library/react'
import FilterSelect from '@/components/Filters/FilterSelect'
import type { Option } from '@/components/Filters/FilterSelect'

describe('FilterSelect', () => {
  const options: Option[] = [
    { label: 'qa', value: 'qa' },
    { label: 'staging', value: 'staging' },
    { label: 'prod', value: 'prod', disabled: true },
  ]

  it('renders label', () => {
    render(<FilterSelect label="Env" value="qa" options={options} onChange={() => {}} />)
    expect(screen.getByText('Env')).toBeInTheDocument()
  })

  it('renders all options', () => {
    render(<FilterSelect label="Env" value="qa" options={options} onChange={() => {}} />)
    expect(screen.getByText('qa')).toBeInTheDocument()
    expect(screen.getByText('staging')).toBeInTheDocument()
    expect(screen.getByText('prod (N/A)')).toBeInTheDocument()
  })

  it('sets selected value', () => {
    const { container } = render(
      <FilterSelect label="Env" value="staging" options={options} onChange={() => {}} />,
    )
    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('staging')
  })

  it('calls onChange with new value', () => {
    const onChange = jest.fn()
    const { container } = render(
      <FilterSelect label="Env" value="qa" options={options} onChange={onChange} />,
    )
    const select = container.querySelector('select')!
    fireEvent.change(select, { target: { value: 'staging' } })
    expect(onChange).toHaveBeenCalledWith('staging')
  })

  it('marks disabled options', () => {
    const { container } = render(
      <FilterSelect label="Env" value="qa" options={options} onChange={() => {}} />,
    )
    const disabledOpt = container.querySelector('option[disabled]')
    expect(disabledOpt).toHaveTextContent('prod (N/A)')
  })
})
