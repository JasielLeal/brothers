import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { ok, badRequest, tooManyRequests, internalError } from '@/lib/api-response'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

const schema = z.object({
  cep: z.string().min(8).max(9),
  totalValue: z.number().positive(),
})

export interface ShippingOption {
  id: number
  name: string
  company: string
  price: number
  days: number
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 cálculos de frete por minuto por IP
    const ip = getClientIp(req)
    const rl = rateLimit(`freight:${ip}`, 10, 60 * 1000)
    if (!rl.allowed) return tooManyRequests(rl.resetInSeconds)

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues[0].message)

    const config = await prisma.freightConfig.findFirst()
    if (!config)
      return badRequest('Configuração de frete não encontrada. Configure na área administrativa.')

    const { cep, totalValue } = parsed.data
    const cleanCep = cep.replace(/\D/g, '')
    const originCep = config.originCep.replace(/\D/g, '')

    // Frete grátis acima do valor configurado
    if (config.freeAbove && totalValue >= config.freeAbove) {
      return ok([
        {
          id: 0,
          name: 'Frete Grátis',
          company: 'Brothers Outlet',
          price: 0,
          days: 5,
        } as ShippingOption,
      ])
    }

    // Always hit the real Melhor Envio API — this endpoint only quotes a
    // price (no shipment is created), so there's no need for a sandbox token.
    const meUrl = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate'

    const payload = {
      from: { postal_code: originCep },
      to: { postal_code: cleanCep },
      package: {
        height: config.defaultHeight,
        width: config.defaultWidth,
        length: config.defaultLength,
        weight: config.defaultWeight,
      },
      options: {
        insurance_value: totalValue,
        receipt: false,
        own_hand: false,
      },
    }

    const token = process.env.MELHOR_ENVIO_TOKEN
    if (!token) return badRequest('Token do Melhor Envio não configurado no servidor.')

    const res = await fetch(meUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Brothers Outlet (contato@brothersoutlet.com.br)',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error('[freight/calculate] Melhor Envio error:', res.status, errBody)
      return badRequest('Não foi possível calcular o frete. Verifique o CEP e tente novamente.')
    }

    const data = await res.json()

    // Filter out services with errors and map to clean format
    const options: ShippingOption[] = (Array.isArray(data) ? data : [])
      .filter((s: { error?: string; price?: string | number }) => !s.error && s.price)
      .map(
        (s: {
          id: number
          name: string
          company: { name: string }
          price: string | number
          delivery_time: number
        }) => ({
          id: s.id,
          name: s.name,
          company: s.company?.name ?? s.name,
          price: typeof s.price === 'string' ? parseFloat(s.price) : s.price,
          days: s.delivery_time,
        })
      )
      .sort((a: ShippingOption, b: ShippingOption) => a.price - b.price)

    if (options.length === 0) {
      return badRequest('Nenhuma opção de frete disponível para este CEP.')
    }

    return ok(options)
  } catch (e) {
    return internalError(e)
  }
}
