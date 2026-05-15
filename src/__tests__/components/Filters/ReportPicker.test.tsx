import { render, screen, fireEvent } from '@testing-library/react'
import ReportPicker from '@/components/Filters/ReportPicker'

const makeReports = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    filename: `report-${i}.json`,
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    time: '09-00-00',
  }))

describe('ReportPicker', () => {
  it('shows "All (N)" when no indices selected', () => {
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[]} onChange={() => {}} />)
    expect(screen.getByText('All (10)')).toBeInTheDocument()
  })

  it('shows "None" when [-1] selected', () => {
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[-1]} onChange={() => {}} />)
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('shows "N selected" for custom selection', () => {
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[0, 3, 7]} onChange={() => {}} />)
    expect(screen.getByText('3 selected')).toBeInTheDocument()
  })

  it('shows "Last N" for matching quick option', () => {
    render(<ReportPicker reports={makeReports(30)} selectedIndices={[0, 1, 2, 3, 4]} onChange={() => {}} />)
    expect(screen.getByText('Last 5')).toBeInTheDocument()
  })

  it('opens dropdown with quick options and report list', () => {
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByText('All (10)'))
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
  })

  it('calls onChange with indices for quick option', () => {
    const onChange = jest.fn()
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('All (10)'))
    fireEvent.click(screen.getByText('5'))
    expect(onChange).toHaveBeenCalledWith([0, 1, 2, 3, 4])
  })

  it('calls onChange with [] for All button', () => {
    const onChange = jest.fn()
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[0, 1]} onChange={onChange} />)
    fireEvent.click(screen.getByText('2 selected'))
    fireEvent.click(screen.getByText('All'))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('calls onChange with [-1] for None button', () => {
    const onChange = jest.fn()
    render(<ReportPicker reports={makeReports(10)} selectedIndices={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('All (10)'))
    // There will be two "None" elements: the button and the state, find the button
    const noneButtons = screen.getAllByText('None')
    fireEvent.click(noneButtons[noneButtons.length - 1])
    expect(onChange).toHaveBeenCalledWith([-1])
  })

  it('toggles individual report checkbox', () => {
    const onChange = jest.fn()
    const reports = makeReports(3)
    render(<ReportPicker reports={reports} selectedIndices={[0, 1]} onChange={onChange} />)
    fireEvent.click(screen.getByText('2 selected'))
    // Uncheck the first report
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])
    expect(onChange).toHaveBeenCalledWith([1])
  })

  it('when all selected, unchecking one selects all except that one', () => {
    const onChange = jest.fn()
    const reports = makeReports(3)
    render(<ReportPicker reports={reports} selectedIndices={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('All (3)'))
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[1])
    expect(onChange).toHaveBeenCalledWith([0, 2])
  })

  it('closes on outside click', () => {
    const reports = makeReports(3)
    render(<ReportPicker reports={reports} selectedIndices={[]} onChange={() => {}} />)
    fireEvent.click(screen.getByText('All (3)'))
    expect(screen.getByText('2026-05-01')).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByText('2026-05-01')).not.toBeInTheDocument()
  })
})
