export default function CookiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-bold tracking-widest text-[#4a9fd4] uppercase">Legal</p>
      <h1 className="mb-2 text-3xl font-black text-white">Política de Cookies</h1>
      <p className="mb-12 text-sm text-white/30">Última atualização: junho de 2025</p>

      <div className="space-y-10 text-sm leading-relaxed text-white/60">
        <section>
          <h2 className="mb-3 text-base font-bold text-white">1. O que são Cookies?</h2>
          <p>
            Cookies são pequenos arquivos de texto armazenados no seu dispositivo quando você visita
            um site. Eles nos ajudam a reconhecer seu navegador, lembrar suas preferências e
            melhorar sua experiência de compra.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">2. Tipos de Cookies que Usamos</h2>

          <div className="mt-3 space-y-4">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-semibold text-white">Essenciais</p>
              <p>
                Necessários para o funcionamento básico da plataforma, como manter itens no carrinho
                e processar pedidos. Não podem ser desativados.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-semibold text-white">Desempenho</p>
              <p>
                Coletam informações anônimas sobre como você usa o site para que possamos melhorar
                sua performance e identificar páginas com problemas.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-semibold text-white">Funcionalidade</p>
              <p>
                Permitem lembrar suas preferências, como idioma e região, para personalizar sua
                experiência sem precisar reconfigurá-las a cada visita.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-semibold text-white">Marketing</p>
              <p>
                Usados para exibir anúncios relevantes com base nos seus interesses. Podem ser
                compartilhados com parceiros de publicidade.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">3. Cookies de Terceiros</h2>
          <p>
            Utilizamos serviços de terceiros que também podem definir cookies, como Google Analytics
            (análise de tráfego), Meta Pixel (publicidade) e gateways de pagamento. Cada um desses
            serviços possui sua própria política de privacidade.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">4. Como Gerenciar Cookies</h2>
          <p>
            Você pode controlar e excluir cookies pelas configurações do seu navegador. A
            desativação de cookies essenciais pode impactar o funcionamento do site. Para saber
            mais, acesse a central de ajuda do seu navegador:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>Google Chrome: Configurações → Privacidade → Cookies</li>
            <li>Mozilla Firefox: Opções → Privacidade e Segurança</li>
            <li>Safari: Preferências → Privacidade</li>
            <li>Microsoft Edge: Configurações → Permissões do site</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">5. Atualizações desta Política</h2>
          <p>
            Esta política pode ser atualizada periodicamente para refletir mudanças em nossas
            práticas ou por exigências legais. Recomendamos revisá-la regularmente. O uso continuado
            do site após alterações implica aceitação da política atualizada.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">6. Contato</h2>
          <p>
            Dúvidas sobre nossa política de cookies? Entre em contato:{' '}
            <span className="text-[#4a9fd4]">privacidade@brothersoutlet.com.br</span>
          </p>
        </section>
      </div>
    </div>
  )
}
