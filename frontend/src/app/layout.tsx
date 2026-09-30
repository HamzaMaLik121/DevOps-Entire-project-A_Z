import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AnimeThreads — Wear the Way of the Warrior',
  description: 'Bushido-inspired anime streetwear. Tees, hoodies and armor for those who live by the code.',
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Zen+Old+Mincho:wght@700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-ink-950 font-sans text-stone-100 antialiased">
        {children}
      </body>
    </html>
  )
}
