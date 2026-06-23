export default function ReembolsoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-bold tracking-widest text-[#4a9fd4] uppercase">Legal</p>
      <h1 className="mb-2 text-3xl font-black text-white">Política de Reembolso</h1>
      <p className="mb-12 text-sm text-white/30">Última atualização: junho de 2025</p>

      <div className="space-y-10 text-sm leading-relaxed text-white/60">
        <section>
          <h2 className="mb-3 text-base font-bold text-white">1. Direito de Arrependimento</h2>
          <p>
            De acordo com o Código de Defesa do Consumidor (Art. 49 da Lei nº 8.078/90), você pode
            cancelar a compra em até{' '}
            <span className="font-semibold text-white">7 dias corridos</span> a partir do
            recebimento do produto, sem necessidade de justificativa.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">2. Condições para Devolução</h2>
          <p>Para que a devolução seja aceita, o produto deve ser devolvido:</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>Na embalagem original, sem sinais de uso</li>
            <li>Com todas as etiquetas e acessórios originais</li>
            <li>Acompanhado da nota fiscal</li>
            <li>Sem danos causados pelo cliente</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">3. Como Solicitar</h2>
          <p>
            Entre em contato com nosso suporte pelo e-mail{' '}
            <span className="text-[#4a9fd4]">suporte@brothersoutlet.com.br</span> informando o
            número do pedido e o motivo da devolução. Nossa equipe responderá em até 2 dias úteis
            com as instruções de envio.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">4. Prazo e Forma do Reembolso</h2>
          <p>
            Após o recebimento e verificação do produto devolvido, o reembolso será processado em
            até <span className="font-semibold text-white">5 dias úteis</span>:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>
              <span className="text-white/80">Cartão de crédito:</span> estorno em até 2 faturas
              seguintes
            </li>
            <li>
              <span className="text-white/80">PIX:</span> crédito em até 1 dia útil após aprovação
            </li>
            <li>
              <span className="text-white/80">Boleto:</span> depósito em conta informada em até 3
              dias úteis
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">5. Produtos com Defeito</h2>
          <p>
            Em caso de produto com defeito de fabricação, você tem direito à troca ou reembolso
            integral em até <span className="font-semibold text-white">30 dias</span> após o
            recebimento. O frete de devolução será custeado pela Brothers Outlet.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">6. Exceções</h2>
          <p>
            Não aceitamos devoluções de produtos personalizados, roupas íntimas, meias ou itens
            claramente usados. Salvo nos casos previstos em lei, como exercício do direito de
            arrependimento ou defeito de fabricação. Produtos em promoção relâmpago podem ter
            políticas específicas informadas no momento da compra.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">7. Frete de Devolução</h2>
          <p>
            Nos casos de exercício do direito de arrependimento dentro do prazo legal de 7 dias
            corridos, a Brothers Outlet fornecerá os meios necessários para a devolução do produto
            sem custos ao consumidor.
          </p>
        </section>
      </div>
    </div>
  )
}
