import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from 'next-themes'

import { AppShell } from '@/components/omar/app-shell'
import { getAlerts } from '@/lib/omar/data'

import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OMAR — Off-Market Acquisition Radar',
  description:
    'Private dealflow terminal that discovers, scores, and tracks off-market acquisition targets across Southern California field-service industries.',
  generator: 'v0.app',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#111214' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // TODO(backend): scope alerts to the authenticated user once auth exists.
  const alerts = await getAlerts()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`bg-background ${archivo.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          value={{ dark: 'dark', light: 'light' }}
          disableTransitionOnChange
        >
          <AppShell alerts={alerts}>{children}</AppShell>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
