import type { Metadata, Viewport } from 'next'
import AuthProvider from '@/components/AuthProvider'
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
    <body>
      <AuthProvider>{children}</AuthProvider>
    </body>
  </html>
)

export default RootLayout
