import AppShell from '@/components/layout/AppShell'
import QueryProvider from '@/components/providers/QueryProvider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
// @ts-ignore - global stylesheet import is handled by Next.js
import FacebookPixel from '@/components/pixel/FacebookPixel'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muaz Technology - Industrial Machinery & Automobile Equipment',
  description: 'Trusted supplier of industrial machinery and automobile equipment in Bangladesh',
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
          <FacebookPixel />
          <AppShell>{children}</AppShell>
        </QueryProvider>
      </body>
    </html>
  )
}
