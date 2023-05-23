import './globals.css'
import { Inter } from 'next/font/google'
import { Wallet } from '@near-wallet-selector/core'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'snapn',
  description: 'Snap 2 Earn',
}



export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
