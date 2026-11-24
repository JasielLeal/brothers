import { DM_Sans } from 'next/font/google'

// Fonte exclusiva do painel admin (a loja continua com Manrope).
export const adminFont = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})
