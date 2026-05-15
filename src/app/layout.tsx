import type { Metadata, Viewport } from 'next'
import './globals.scss'

export const metadata: Metadata = {
  title: 'E2E Test Failure Matrix',
  description: 'Dynamic Cypress test failure history dashboard',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="en">
    <body>{children}</body>
  </html>
)

export default RootLayout
