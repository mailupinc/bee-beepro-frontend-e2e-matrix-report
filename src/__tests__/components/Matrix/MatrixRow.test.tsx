import { render, screen } from '@testing-library/react'
import MatrixRow from '@/components/Matrix/MatrixRow'
import { makeCell, makeReport, makeRow } from '../../fixtures'

const wrap = (ui: React.ReactElement) =>
  render(<table><tbody>{ui}</tbody></table>)

describe('MatrixRow', () => {
  const reports = [makeReport(0), makeReport(1), makeReport(2)]

  it('renders test name and file path', () => {
    const row = makeRow({ testName: 'My Test > works', filePath: 'feat/test.cy.ts' })
    wrap(<MatrixRow row={row} reports={reports} />)
    expect(screen.getByText('My Test > works')).toBeInTheDocument()
    expect(screen.getByText('feat/test.cy.ts')).toBeInTheDocument()
  })

  it('renders owner with @ prefix', () => {
    const row = makeRow({ owner: 'dave' })
    wrap(<MatrixRow row={row} reports={reports} />)
    expect(screen.getByText('@dave')).toBeInTheDocument()
  })

  it('renders "Unknown" for unknown owner', () => {
    const row = makeRow({ owner: 'unknown' })
    wrap(<MatrixRow row={row} reports={reports} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('renders failure rate', () => {
    const row = makeRow({ failureRate: 33.3 })
    wrap(<MatrixRow row={row} reports={reports} />)
    expect(screen.getByText('33.3%')).toBeInTheDocument()
  })

  it('renders correct number of cells', () => {
    const row = makeRow()
    const { container } = wrap(<MatrixRow row={row} reports={reports} />)
    // 3 fixed cells (name, owner, rate) + 3 report cells
    const tds = container.querySelectorAll('td')
    expect(tds.length).toBe(6)
  })

  it('calls onCellClick with report filename when a cell is clicked', () => {
    const onCellClick = jest.fn()
    const row = makeRow({ cells: [makeCell('failed'), makeCell('passed'), null] })
    const { container } = wrap(<MatrixRow row={row} reports={reports} onCellClick={onCellClick} />)
    // Click the first report cell (4th td overall)
    const tds = container.querySelectorAll('td')
    tds[3].click()
    expect(onCellClick).toHaveBeenCalledWith(reports[0].filename)
  })

  it('does not call onCellClick for null cell', () => {
    const onCellClick = jest.fn()
    const row = makeRow({ cells: [null, null, null] })
    const { container } = wrap(<MatrixRow row={row} reports={reports} onCellClick={onCellClick} />)
    const tds = container.querySelectorAll('td')
    tds[3].click()
    expect(onCellClick).not.toHaveBeenCalled()
  })
})
