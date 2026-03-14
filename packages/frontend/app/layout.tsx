import './globals.css'
import type { Metadata } from 'next'
import SiteNav from './components/SiteNav'
import { DemoModeProvider } from './lib/DemoModeProvider'

export const metadata: Metadata = {
  title: 'TrapRoyaltiesPro — Music Rights Management',
  description: 'Enterprise music rights management: catalog audit, royalty recovery, digital contracts, DDEX distribution',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="antialiased">
        <DemoModeProvider>
          <SiteNav />
          <div className="pt-12">{children}</div>
        </DemoModeProvider>
      </body>
    </html>
  )
}
