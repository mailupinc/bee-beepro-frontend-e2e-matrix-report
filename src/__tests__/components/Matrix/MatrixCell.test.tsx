import { render, screen } from '@testing-library/react'
import MatrixCell from '@/components/Matrix/MatrixCell'
import { makeCell, makeReport } from '../../fixtures'

describe('MatrixCell', () => {
  it('renders dash for null cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={null} /></tr></tbody></table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('–')
  })

  it('renders check mark for passed cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('passed')} /></tr></tbody></table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('✓')
  })

  it('renders cross for failed cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('failed')} /></tr></tbody></table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('✗')
  })

  it('renders pause for pending cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('pending')} /></tr></tbody></table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('⏸')
  })

  it('renders circle-slash for skipped cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('skipped')} /></tr></tbody></table>,
    )
    expect(container.querySelector('td')).toHaveTextContent('⊘')
  })

  it('applies success class for passed cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('passed')} /></tr></tbody></table>,
    )
    expect(container.querySelector('.success')).toBeInTheDocument()
  })

  it('applies failure class for failed cell', () => {
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('failed')} /></tr></tbody></table>,
    )
    expect(container.querySelector('.failure')).toBeInTheDocument()
  })

  it('shows title with report info when report provided', () => {
    const report = makeReport(0)
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('passed')} report={report} /></tr></tbody></table>,
    )
    const td = container.querySelector('td')!
    expect(td.getAttribute('title')).toContain(report.date)
    expect(td.getAttribute('title')).toContain('Passed')
  })

  it('shows "Not present" title for null cell with report', () => {
    const report = makeReport(0)
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={null} report={report} /></tr></tbody></table>,
    )
    const td = container.querySelector('td')!
    expect(td.getAttribute('title')).toContain('Not present')
  })

  it('calls onClick when cell is clicked', () => {
    const onClick = jest.fn()
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={makeCell('failed')} onClick={onClick} /></tr></tbody></table>,
    )
    container.querySelector('td')!.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('does not call onClick for null cell', () => {
    const onClick = jest.fn()
    const { container } = render(
      <table><tbody><tr><MatrixCell cell={null} onClick={onClick} /></tr></tbody></table>,
    )
    container.querySelector('td')!.click()
    expect(onClick).not.toHaveBeenCalled()
  })
})
