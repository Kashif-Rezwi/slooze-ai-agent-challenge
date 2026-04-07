import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Slooze AI',
  description: 'Unified AI assistant — web search and document Q&A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  )
}
