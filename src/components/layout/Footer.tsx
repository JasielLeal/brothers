'use client'

import Image from 'next/image'
import Link from 'next/link'
import logo from '@/../public/logo.png'

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d0d0d]">
      {/* Main */}
      <div className="mx-auto max-w-screen-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Col 1 — Logo + CNPJ */}
          <div className="flex flex-col items-start gap-5">
            <Image
              src={logo}
              alt="Brothers Outlet"
              width={80}
              height={80}
              className="h-10 w-auto object-contain"
            />
            <p className="text-sm text-white/40">
              Sua loja de confiança para encontrar produtos de qualidade, preços justos e uma
              experiência de compra segura do início ao fim.
            </p>
          </div>

          {/* Col 2 — Redes Sociais */}
          <div className="flex flex-col gap-5">
            <div>
              <p className="mb-3 font-semibold text-white">Redes Sociais</p>
            </div>
            <div className="flex gap-4">
              {[
                {
                  label: 'Instagram',
                  path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
                },
                {
                  label: 'WhatsApp',
                  path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z',
                },
              ].map(({ label, path }) => (
                <a
                  key={label}
                  href={
                    label === 'Instagram'
                      ? 'https://www.instagram.com/brothersoutlet_oficial/'
                      : 'https://api.whatsapp.com/send/?phone=5584991162462&text&type=phone_number&app_absent=0&utm_source=ig'
                  }
                  target={label === 'Instagram' ? '_blank' : '_blank'}
                  rel={label === 'Instagram' ? 'noopener noreferrer' : undefined}
                  aria-label={label}
                  className="text-white/30 transition-colors hover:text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d={path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Col 3 — Links legais */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Páginas Legais</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li>
                <Link href="/termos" className="transition-colors hover:text-white">
                  Termos e condições
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors hover:text-white">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link href="/reembolso" className="transition-colors hover:text-white">
                  Política de reembolso
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="transition-colors hover:text-white">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4 — Links importantes */}
          <div>
            <h4 className="mb-4 font-semibold text-white">Links Importantes</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li>
                <Link
                  href="https://api.whatsapp.com/send/?phone=5584991162462&text&type=phone_number&app_absent=0&utm_source=ig"
                  className="transition-colors hover:text-white"
                >
                  Ajuda
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className="transition-colors hover:text-white">
                  Painel admin
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Brothers Outlet. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-white/30">
            <Link href="/privacidade" className="hover:text-white">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="hover:text-white">
              Termos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
