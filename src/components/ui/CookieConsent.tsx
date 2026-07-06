'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Cookie } from 'lucide-react'

const STORAGE_KEY = 'brothersoutlet_cookie_consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          className="fixed inset-x-0 bottom-0 z-100 px-4 pb-4 sm:px-6 sm:pb-6"
          role="dialog"
          aria-live="polite"
          aria-label="Aviso de cookies"
        >
          <div className="mx-auto flex max-w-sm flex-col items-center gap-4 rounded-2xl border border-white/10 bg-[#151515] p-5 text-center shadow-2xl">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4a9fd4]/10 text-[#4a9fd4]">
              <Cookie className="h-4.5 w-4.5" />
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Usamos cookies para melhorar sua experiência e lembrar suas preferências. Ao continuar
              navegando, você concorda com nossa{' '}
              <Link href="/cookies" className="text-[#4a9fd4] hover:underline">
                Política de Cookies
              </Link>
              .
            </p>
            <div className="flex w-full items-center gap-2">
              <button
                onClick={decline}
                className="flex-1 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-white/60 transition-colors hover:bg-white/5 hover:text-white"
              >
                Recusar
              </button>
              <button
                onClick={accept}
                className="flex-1 rounded-lg bg-[#4a9fd4] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3d8bc0]"
              >
                Aceitar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
