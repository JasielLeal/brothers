import { Footer } from '@/components/layout/Footer'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { CookieConsent } from '@/components/ui/CookieConsent'
import type { ReactNode } from 'react'
import { DemoNavbar } from './DemoNavbar'

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0d0d0d] text-white">
      <DemoNavbar />
      <main className="flex w-full flex-1 flex-col pt-17">{children}</main>
      <Footer />
      <WhatsAppButton />
      <CookieConsent />
    </div>
  )
}
