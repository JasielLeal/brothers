import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import type { ReactNode } from 'react'

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-white">
      <Navbar />
      <main className="flex w-full flex-1 flex-col pt-17">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  )
}
