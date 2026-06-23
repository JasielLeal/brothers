export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="mb-2 text-xs font-bold tracking-widest text-[#4a9fd4] uppercase">Legal</p>
      <h1 className="mb-2 text-3xl font-black text-white">Política de Privacidade</h1>
      <p className="mb-12 text-sm text-white/30">Última atualização: junho de 2025</p>

      <div className="space-y-10 text-sm leading-relaxed text-white/60">
        <section>
          <h2 className="mb-3 text-base font-bold text-white">1. Dados que Coletamos</h2>
          <p>
            Coletamos informações fornecidas diretamente por você ao realizar um pedido, incluindo
            nome, celular, endereço e dados de pagamento. Também coletamos dados de navegação como
            endereço IP, tipo de dispositivo e páginas visitadas.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">2. Como Usamos seus Dados</h2>
          <ul className="list-disc space-y-1.5 pl-4">
            <li>Processar e entregar seus pedidos</li>
            <li>Enviar atualizações sobre o status do pedido via WhatsApp ou SMS</li>
            <li>Melhorar nossos produtos e serviços</li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">3. Compartilhamento de Dados</h2>
          <p>
            Não vendemos seus dados pessoais. Podemos compartilhá-los com parceiros de entrega,
            processadores de pagamento e prestadores de serviços tecnológicos estritamente
            necessários para o funcionamento da plataforma, sempre sob acordos de confidencialidade.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">4. Segurança</h2>
          <p>
            Utilizamos criptografia SSL/TLS para proteger a transmissão de dados. Suas informações
            de pagamento são processadas por gateways certificados PCI-DSS e nunca armazenadas em
            nossos servidores.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">5. Seus Direitos (LGPD)</h2>
          <p>
            De acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-4">
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão dos seus dados</li>
            <li>Obter informações sobre o compartilhamento de dados</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">6. Retenção de Dados</h2>
          <p>
            Mantemos seus dados pelo período necessário para cumprir as finalidades descritas nesta
            política, respeitando os prazos legais obrigatórios, como os exigidos pela legislação
            fiscal e comercial brasileira.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-base font-bold text-white">7. Contato</h2>
          <p>
            Para exercer seus direitos ou esclarecer dúvidas sobre o tratamento dos seus dados,
            entre em contato com nosso Encarregado de Proteção de Dados (DPO) pelo e-mail:{' '}
            <span className="text-[#4a9fd4]">privacidade@brothersoutlet.com.br</span>
          </p>
        </section>
      </div>
    </div>
  )
}
