import Image from 'next/image'
import Link from 'next/link'
import { Search, ShoppingCart, Heart } from 'lucide-react'
import logo from '@/../public/logo.png'

const FAKE_CATEGORIES = [
  'Camisetas',
  'Calças',
  'Calçados',
  'Jaquetas',
  'Acessórios',
  'Moletons',
  'Bonés',
  'Tênis Esportivos',
]

export function DemoNavbar() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/10 bg-[#0d0d0d]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-17 max-w-screen-2xl items-center gap-6 px-6 lg:px-10">
        <Link href="/demo" className="shrink-0">
          <Image
            src={logo}
            alt="Brothers Outlet"
            width={30}
            height={30}
            className="h-7 w-auto object-contain"
          />
        </Link>

        <div className="hidden h-5 w-px bg-white/10 lg:block" />

        <nav className="hidden flex-1 items-center justify-center lg:flex">
          {FAKE_CATEGORIES.map((name) => (
            <a
              key={name}
              href="#colecao"
              className="px-3 py-2 text-sm font-medium whitespace-nowrap text-white/60 transition-colors hover:text-white"
            >
              {name}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Buscar"
          >
            <Search className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Favoritos"
          >
            <Heart className="h-4.5 w-4.5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              5
            </span>
          </button>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-4.5 w-4.5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1565a0] text-[10px] font-bold text-white">
              2
            </span>
          </button>
        </div>

        {/* Mobile — só ícones essenciais */}
        <div className="ml-auto flex items-center gap-1 lg:hidden">
          <button
            type="button"
            className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="relative rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Carrinho"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1565a0] text-[10px] font-bold text-white">
              2
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
