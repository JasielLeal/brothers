import type { Metadata } from 'next'
import { AdminLoginForm } from '@/features/auth/components/AdminLoginForm'
import Image from 'next/image'
import logo from '@/../public/logo.png'

export const metadata: Metadata = {
  title: 'Login | Painel Administrativo',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex lg:w-1/2">
        {/* gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a4d7a] via-[#14649e] to-[#4A6CF7]" />

        {/* decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-60px] left-[-60px] h-64 w-64 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/4 blur-3xl" />

        {/* logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <Image src={logo} alt="Brothers Outlet Logo" width={136} height={136} />
        </div>

        {/* center tagline */}
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-medium tracking-widest text-white/50 uppercase">
            Painel Administrativo
          </p>
          <h2 className="text-6xl leading-tight font-bold text-white">
            Gerencie seu negócio <span className="text-white/70">com eficiência e clareza.</span>
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">
            Controle produtos, pedidos, fornecedores e analytics em um único lugar.
          </p>
        </div>

        {/* bottom caption */}
        <div className="relative z-10 flex items-center justify-between">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Brothers Outlet. Acesso restrito.
          </p>
          <p className="text-xs font-semibold tracking-wide text-white/60">
            Desenvolvido por{' '}
            <a
              href="https://kaizestudios.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white underline-offset-2 hover:underline"
            >
              Kaize Studios
            </a>
          </p>
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          {/* mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <Image
              src={logo}
              alt="Brothers Outlet Logo"
              className="h-9 w-9 rounded-xl bg-[#14649e]"
            />
            <span className="text-base font-semibold text-gray-800">Brothers Outlet</span>
          </div>

          <h1 className="mb-1.5 hidden text-2xl font-bold text-gray-900 lg:block">
            Bem-vindo de volta
          </h1>
          <p className="mb-6 text-sm text-gray-500">
            Entre com suas credenciais para acessar o painel.
          </p>

          <AdminLoginForm />
        </div>
      </div>
    </div>
  )
}
