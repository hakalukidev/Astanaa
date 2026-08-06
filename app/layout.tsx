import AppShell from '@/components/layout/AppShell'
import QueryProvider from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { LanguageProvider } from '@/contexts/LanguageContext'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// @ts-ignore - global stylesheet import is handled by Next.js
import FacebookPixel from '@/components/pixel/FacebookPixel'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Astanaa.com - Buy & Sell Apartments in Bangladesh',
  description: 'Post your apartment for sale or rent, and find your next home on Astanaa.com.',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="bn">
      <head>
        {/* Facebook Pixel Noscript Fallback */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: 'none' }}
            src="https://www.facebook.com/tr?id=688934052520021&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </head>
      <body className={inter.className}>
        <QueryProvider>
          <LanguageProvider>
            <AuthProvider>
              <FacebookPixel />
              <AppShell>{children}</AppShell>
            </AuthProvider>
          </LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
