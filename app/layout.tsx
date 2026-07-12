import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/providers/Providers'
import { Manrope } from 'next/font/google'
import { auth } from '@/auth'

const manrope = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Brothers Outlet',
    template: '%s | Brothers Outlet',
  },
  description: 'Sua loja de moda com os melhores produtos e preços.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()

  return (
    <html lang="pt-BR" className={`h-full antialiased ${manrope.className}`}>
      <body className="flex min-h-full flex-col">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  )
}
