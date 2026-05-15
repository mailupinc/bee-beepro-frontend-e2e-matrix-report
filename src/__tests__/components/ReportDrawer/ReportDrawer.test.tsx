import { render, screen, fireEvent } from '@testing-library/react'
import ReportDrawer from '@/components/ReportDrawer/ReportDrawer'

describe('ReportDrawer', () => {
  it('renders nothing when url is null', () => {
    const { container } = render(<ReportDrawer url={null} onClose={() => {}} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders iframe with correct src when url provided', () => {
    render(<ReportDrawer url="https://example.com/report" onClose={() => {}} />)
    const iframe = screen.getByTitle('Mochawesome Report') as HTMLIFrameElement
    expect(iframe.src).toBe('https://example.com/report')
  })

  it('renders "Open in new tab" link', () => {
    render(<ReportDrawer url="https://example.com/report" onClose={() => {}} />)
    const link = screen.getByText('Open in new tab ↗') as HTMLAnchorElement
    expect(link.href).toBe('https://example.com/report')
    expect(link.target).toBe('_blank')
  })

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn()
    render(<ReportDrawer url="https://example.com/report" onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn()
    const { container } = render(<ReportDrawer url="https://example.com/report" onClose={onClose} />)
    const backdrop = container.querySelector('.backdrop')!
    fireEvent.click(backdrop)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape key', () => {
    const onClose = jest.fn()
    render(<ReportDrawer url="https://example.com/report" onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not listen for Escape when url is null', () => {
    const onClose = jest.fn()
    render(<ReportDrawer url={null} onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).not.toHaveBeenCalled()
  })
})
