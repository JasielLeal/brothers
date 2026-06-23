'use client'

import { motion } from 'framer-motion'

const WA_URL =
  'https://api.whatsapp.com/send/?phone=5584991162462&text&type=phone_number&app_absent=0'

export function WhatsAppButton() {
  return (
    <motion.a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed right-6 bottom-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/30"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      {/* WhatsApp SVG icon */}
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3C9.373 3 4 8.373 4 15c0 2.385.67 4.61 1.832 6.5L4 29l7.75-1.812A12.94 12.94 0 0 0 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22a10.94 10.94 0 0 1-5.565-1.52l-.397-.236-4.102.957.993-3.986-.26-.41A10.95 10.95 0 0 1 5 15C5 8.925 9.925 4 16 4s11 4.925 11 11-4.925 10-11 10zm6.03-7.617c-.33-.165-1.953-.963-2.256-1.074-.303-.11-.523-.165-.743.165s-.853 1.074-1.046 1.294c-.193.22-.385.248-.715.083-.33-.165-1.392-.513-2.651-1.636-.98-.873-1.642-1.95-1.835-2.28-.193-.33-.02-.508.145-.672.149-.148.33-.385.495-.578.165-.193.22-.33.33-.55.11-.22.055-.413-.027-.578-.083-.165-.743-1.79-1.018-2.45-.268-.644-.54-.557-.743-.567l-.633-.012c-.22 0-.578.083-.88.413-.303.33-1.155 1.128-1.155 2.753s1.183 3.193 1.347 3.413c.165.22 2.328 3.556 5.644 4.99.789.34 1.405.543 1.885.695.792.252 1.513.216 2.083.131.636-.094 1.953-.798 2.228-1.57.275-.771.275-1.432.193-1.57-.083-.138-.303-.22-.633-.385z" />
      </svg>

      {/* Pulse ring */}
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25D366] opacity-25" />
    </motion.a>
  )
}
