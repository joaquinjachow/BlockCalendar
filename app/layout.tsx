import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { AuthProvider } from '@/contexts/auth-context'
import { NotesProvider } from '@/contexts/notes-context'
import { PwaRegister } from '@/components/pwa-register'
import { AppShell } from '@/components/app-shell'
import './globals.css'

export const metadata: Metadata = {
  title: 'NotaCal - Notas y Calendario',
  description: 'Tu bloc de notas y calendario en uno. Escribe notas con fechas y se agregan automáticamente al calendario.',
  applicationName: 'NotaCal',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NotaCal',
  },
  icons: {
    icon: {
      url: '/favicon.svg',
      type: 'image/svg+xml',
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <PwaRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <NotesProvider>
              <AppShell>{children}</AppShell>
            </NotesProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
