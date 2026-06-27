# Relatório de Auditoria Técnica — Brothers Outlet

**Data:** 26/06/2026  
**Revisão:** 2.0 (pós-fixes)  
**Stack:** Next.js 16.2.4 · Prisma 7 · Auth.js v5 beta.31 · Tailwind v4 · Zustand v5  
**Auditor:** Auditoria automatizada — leitura direta dos arquivos de produção

---

## Resumo Executivo

Esta auditoria lê o estado **atual** do código fonte, após uma rodada anterior de fixes documentados internamente. A base de código apresenta uma melhoria substancial em relação ao estado pré-fix: preços são lidos do banco de dados server-side, cupons são consumidos atomicamente via `$executeRaw` com condição de guarda, o controle de acesso para endpoints críticos (upload, criação/deleção de produtos) usa `requireAdmin()` corretamente, e o middleware de rota protege o painel `/admin` integralmente via proxy Auth.js.

Permanecem problemas de severidade **ALTA** e **MÉDIA** ativos, concentrados principalmente em: (a) ausência de separação de role entre VIEWER e ADMIN em endpoints de escrita de dados financeiros/operacionais (fornecedores, boletos, despesas, categorias, marcas, tipos, cupons e variantes), onde qualquer usuário autenticado — incluindo VIEWERs — pode criar, editar e deletar dados sensíveis; (b) analytics e dashboard calculados inteiramente no cliente sobre um payload de até 1.000 pedidos; (c) validação de frete não recalculada server-side a partir dos produtos reais do pedido; (d) ausência de `Content-Security-Policy` nos headers HTTP.

O código não apresenta SQL injection (queries parametrizadas via `Prisma.sql` e ORM), não há dados sensíveis expostos publicamente (costPrice, marginPercent filtrados), e a lógica de estoque é atômica. O estado geral é seguro para operação com um único usuário ADMIN, mas requer os fixes de role abaixo antes de criar qualquer usuário VIEWER.

---

## Índice de Status

| #   | Problema                                                                          | Severidade | Status                                  |
| --- | --------------------------------------------------------------------------------- | ---------- | --------------------------------------- |
| #1  | Preço dos itens lido do banco (não do cliente)                                    | CRÍTICA    | ✅ RESOLVIDO                            |
| #2  | Cupom consumido atomicamente com `$executeRaw`                                    | CRÍTICA    | ✅ RESOLVIDO                            |
| #3  | Upload restrito a ADMIN com validação MIME e tamanho                              | ALTA       | ✅ RESOLVIDO                            |
| #4  | Estoque decrementado atomicamente na transação                                    | CRÍTICA    | ✅ RESOLVIDO                            |
| #5  | Estoque restaurado no cancelamento de pedido                                      | ALTA       | ✅ RESOLVIDO                            |
| #6  | Transições de status do pedido validadas server-side                              | ALTA       | ✅ RESOLVIDO                            |
| #7  | Frete grátis validado server-side (`freightConfig.freeAbove`)                     | ALTA       | ✅ RESOLVIDO                            |
| #8  | SSRF no upload bloqueado (só aceita data URIs)                                    | ALTA       | ✅ RESOLVIDO                            |
| #9  | Rate limiting em `/api/orders`, `/api/coupons/validate`, `/api/freight/calculate` | MÉDIA      | ✅ RESOLVIDO                            |
| #10 | TOCTOU do cupom eliminado (leitura dentro da transação)                           | ALTA       | ✅ RESOLVIDO                            |
| #11 | Headers de segurança HTTP configurados no `next.config.ts`                        | MÉDIA      | ✅ RESOLVIDO (parcial — CSP ausente)    |
| #12 | `costPrice`/`marginPercent`/`supplierId` excluídos do select público              | ALTA       | ✅ RESOLVIDO                            |
| #13 | `requireAdmin()` aplicado em POST/PUT/DELETE de produtos                          | ALTA       | ✅ RESOLVIDO                            |
| #14 | `requireAdmin()` ausente em Fornecedores (POST/PUT/DELETE)                        | ALTA       | ✅ RESOLVIDO                            |
| #15 | `requireAdmin()` ausente em Boletos (POST/PATCH/DELETE)                           | ALTA       | ✅ RESOLVIDO                            |
| #16 | `requireAdmin()` ausente em Despesas (POST/DELETE)                                | ALTA       | ✅ RESOLVIDO                            |
| #17 | `requireAdmin()` ausente em Categorias (POST/PUT/DELETE)                          | MÉDIA      | ✅ RESOLVIDO                            |
| #18 | `requireAdmin()` ausente em Marcas (POST/PUT/DELETE)                              | MÉDIA      | ✅ RESOLVIDO                            |
| #19 | `requireAdmin()` ausente em Tipos de Produto (POST/PUT/DELETE)                    | MÉDIA      | ✅ RESOLVIDO                            |
| #20 | `requireAdmin()` ausente em Cupons (POST/PATCH/DELETE)                            | ALTA       | ✅ RESOLVIDO                            |
| #21 | `requireAdmin()` ausente em Variantes de Produto (POST/PUT/DELETE)                | ALTA       | ✅ RESOLVIDO                            |
| #22 | Analytics e Dashboard calculados no cliente com `limit: 1000`                     | MÉDIA      | ⚠️ PENDENTE                             |
| #23 | `apiToken` do Melhor Envio removido do banco                                      | BAIXA      | ✅ RESOLVIDO                            |
| #24 | `Content-Security-Policy` ausente nos headers HTTP                                | MÉDIA      | ✅ RESOLVIDO                            |
| #25 | `prettier-plugin-tailwindcss` em versão insiders em devDependencies               | BAIXA      | ✅ RESOLVIDO (`^0.6.0`)                 |
| #26 | Default de role corrigido de ADMIN para VIEWER                                    | BAIXA      | ✅ RESOLVIDO (migration 20260626000007) |
| #27 | Dashboard traz `costPrice` ao browser via `useProducts`                           | MÉDIA      | ⚠️ PENDENTE                             |
| #28 | Barcode scan acessível a qualquer autenticado (VIEWER)                            | BAIXA      | ⚠️ PENDENTE (aceitável)                 |
| #29 | `deduct-stock` endpoint acessível a VIEWER sem validação de pedido associado      | ALTA       | ✅ RESOLVIDO                            |
| #30 | Frete calculado com peso/dimensões padrão, não reais por produto                  | MÉDIA      | ⚠️ PENDENTE                             |
| #31 | `shippingCost` cliente pode ser manipulado para valores acima de zero             | MÉDIA      | ⚠️ PENDENTE (parcial)                   |
| #32 | In-memory rate limiter não funciona em multi-instância/serverless                 | BAIXA      | ⚠️ PENDENTE (documentado)               |
| #33 | `internalError` não vaza dados em produção — não é problema                       | INFO       | ✅ VERIFICADO OK                        |
| #34 | GET `/api/products/[id]/variants` sem autenticação                                | BAIXA      | ⚠️ PENDENTE (aceitável)                 |
| #35 | Paginação ausente em `/api/expenses` e `/api/coupons`                             | BAIXA      | ✅ RESOLVIDO                            |

---

## Problemas Ativos

### [ALTA] #14 — VIEWER pode criar, editar e deletar Fornecedores

**Arquivo:** `app/api/suppliers/route.ts` (POST, linha 55) · `app/api/suppliers/[id]/route.ts` (PUT linha 31, DELETE linha 48)  
**Categoria:** OWASP A01 — Broken Access Control

**Explicação:**  
Os endpoints de escrita de fornecedores verificam apenas `session?.user` (qualquer autenticado), sem exigir `role === 'ADMIN'`. Um usuário com role VIEWER pode criar fornecedores falsos, alterar dados de fornecedores existentes (CNPJ, email, telefone) ou deletar fornecedores com relacionamento a produtos.

```typescript
// suppliers/route.ts linha 55-58 — ATUAL (incorreto)
const session = await auth()
if (!session?.user) return unauthorized()
// ← sem verificação de role — VIEWER passa
```

**Impacto:** Usuário VIEWER pode cadastrar fornecedores fraudulentos, alterar contatos (e.g., trocar email de fornecedor real) ou deletar registros de fornecedores ativos.

**Correção:**

```typescript
// suppliers/route.ts — POST; [id]/route.ts — PUT e DELETE
import { requireAdmin, requireAuth } from '@/lib/auth-guard'

export async function GET(req: NextRequest) {
  const { error } = await requireAuth() // leitura: qualquer autenticado
  if (error) return error
  // ...
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin() // escrita: apenas ADMIN
  if (error) return error
  // ...
}
```

---

### [ALTA] #15 — VIEWER pode criar, editar e deletar Boletos

**Arquivo:** `app/api/boletos/route.ts` (POST, linha 55) · `app/api/boletos/[id]/route.ts` (PATCH linha 29, DELETE linha 50)  
**Categoria:** OWASP A01 — Broken Access Control / OWASP A04 — Insecure Design

**Explicação:**  
Boletos são documentos financeiros com `amount`, `dueDate` e `status`. Qualquer usuário autenticado pode criar boletos com valor arbitrário, marcar boletos como `PAID` (setando `paidAt`), alterar valor/vencimento, ou deletar registros financeiros, comprometendo a integridade contábil.

**Como reproduzir:**

```bash
# Como VIEWER autenticado — marcar boleto real como pago:
curl -X PATCH /api/boletos/BOLETO_ID \
  -H "Cookie: authjs.session-token=VIEWER_TOKEN" \
  -d '{"status":"PAID","paidAt":"2026-01-01T00:00:00.000Z"}'
# HTTP 200 — boleto marcado como pago sem autorização
```

**Impacto:** Manipulação de registros financeiros. Um funcionário mal-intencionado pode marcar boletos vencidos como pagos ou deletar registros de dívidas.

**Correção:** Substituir `auth()` por `requireAdmin()` em POST (`boletos/route.ts:55`), PATCH (`boletos/[id]/route.ts:29`) e DELETE (`boletos/[id]/route.ts:50`).

---

### [ALTA] #16 — VIEWER pode criar e deletar Despesas

**Arquivo:** `app/api/expenses/route.ts` (POST, linha 50) · `app/api/expenses/[id]/route.ts` (DELETE, linha 6)  
**Categoria:** OWASP A01 — Broken Access Control

**Explicação:**  
Despesas (`Expense` com `amount`, `category`, `date`) fazem parte do módulo financeiro. Qualquer usuário autenticado pode criar despesas fictícias para inflar custos operacionais no painel Analytics, ou deletar despesas reais para ocultar gastos.

**Impacto:** Dados financeiros adulterados. Possível cobertura de desvios ao deletar registros de despesas reais.

**Correção:** Substituir `auth()` por `requireAdmin()` em POST (`expenses/route.ts:50`) e DELETE (`expenses/[id]/route.ts:6`).

---

### [ALTA] #20 — VIEWER pode criar, editar e deletar Cupons

**Arquivo:** `app/api/coupons/route.ts` (POST, linha 32) · `app/api/coupons/[id]/route.ts` (PATCH linha 13, DELETE linha 39)  
**Categoria:** OWASP A01 — Broken Access Control / OWASP A04 — Insecure Design

**Explicação:**  
Todos os endpoints de mutação de cupons verificam apenas autenticação genérica. Um VIEWER pode:

- Criar cupons com 100% de desconto (`type: 'PERCENTAGE', value: 100`)
- Aumentar `maxUses` de um cupom esgotado para continuar usando
- Reativar cupons expirados (`isActive: true`)
- Deletar cupons de campanhas ativas

**Impacto:** Criação de cupons fraudulentos resulta em perda direta de receita. Este é o vetor de impacto financeiro mais direto dos problemas de role.

**Correção:** Substituir `auth()` por `requireAdmin()` nos três métodos de mutação. O GET (lista de cupons admin) pode permanecer com `requireAuth()`.

---

### [ALTA] #21 — VIEWER pode criar, editar e deletar Variantes de Produto

**Arquivo:** `app/api/products/[id]/variants/route.ts` (POST, linha 36) · `app/api/products/[id]/variants/[variantId]/route.ts` (PUT linha 21, DELETE linha 61)  
**Categoria:** OWASP A01 — Broken Access Control

**Explicação:**  
As variantes (cores, imagens, barcodes, estoque por tamanho) podem ser criadas/editadas/deletadas por qualquer VIEWER. A deleção de uma variante com `onDelete: Cascade` no schema remove também os `VariantSizeStock` associados, potencialmente zerando estoque de uma cor inteira.

**Correção:** Substituir `auth()` por `requireAdmin()` em POST, PUT e DELETE nas duas rotas de variantes.

---

### [ALTA] #29 — `deduct-stock` acessível a VIEWER sem vínculo com pedido (NOVO)

**Arquivo:** `app/api/products/[id]/deduct-stock/route.ts` (linha 13)  
**Categoria:** OWASP A01 — Broken Access Control / OWASP A04 — Insecure Design

**Explicação:**  
O endpoint `POST /api/products/[id]/deduct-stock` decrementa o estoque de um produto/variante atomicamente. A verificação de autenticação é apenas `session?.user` — qualquer VIEWER autenticado pode chamar este endpoint arbitrariamente sem um pedido associado, zerando o estoque de produtos.

```typescript
// deduct-stock/route.ts linha 13-15 — ATUAL (incorreto)
const session = await auth()
if (!session?.user) return unauthorized()
// ← sem requireAdmin(); sem verificação de orderId associado
```

**Como reproduzir:**

```bash
# Como VIEWER autenticado:
curl -X POST /api/products/PRODUCT_ID/deduct-stock \
  -H "Cookie: authjs.session-token=VIEWER_TOKEN" \
  -d '{"color":"Preto","size":"M","quantity":999}'
# HTTP 200 — estoque zerado sem pedido criado
```

**Impacto:** Denial of inventory — sabotagem do catálogo zerando estoque de qualquer produto sem rastro em `Order`. Um VIEWER mal-intencionado pode tornar toda a loja out-of-stock.

**Correção:**

```typescript
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error } = await requireAdmin()
  if (error) return error
  // ...
}
```

---

### [MÉDIA] #17 — VIEWER pode criar, editar e deletar Categorias

**Arquivo:** `app/api/categories/route.ts` (POST, linha 26) · `app/api/categories/[id]/route.ts` (PUT linha 27, DELETE linha 44)  
**Categoria:** OWASP A01 — Broken Access Control

**Explicação:**  
Categorias definem a estrutura do catálogo público e seus slugs são usados em URLs. Um VIEWER pode criar categorias duplicadas, alterar slugs (quebrando URLs de SEO/links externos), ou tentar deletar categorias (o banco retorna erro de FK, mas a tentativa existe).

**Correção:** Substituir `auth()` por `requireAdmin()` em POST, PUT e DELETE.

---

### [MÉDIA] #18 — VIEWER pode criar, editar e deletar Marcas

**Arquivo:** `app/api/brands/route.ts` (POST, linha 24) · `app/api/brands/[id]/route.ts` (PUT linha 16, DELETE linha 33)  
**Categoria:** OWASP A01 — Broken Access Control

**Correção:** Idêntica ao #17.

---

### [MÉDIA] #19 — VIEWER pode criar, editar e deletar Tipos de Produto

**Arquivo:** `app/api/product-types/route.ts` (POST, linha 24) · `app/api/product-types/[id]/route.ts` (PUT linha 16, DELETE linha 33)  
**Categoria:** OWASP A01 — Broken Access Control

**Correção:** Idêntica ao #17.

---

### [MÉDIA] #22 — Analytics e Dashboard calculados inteiramente no cliente

**Arquivo:** `app/admin/(protected)/dashboard/page.tsx` (linhas 196–197) · `app/admin/(protected)/analytics/page.tsx` (linhas 348–349)  
**Categoria:** Performance / OWASP A04 — Insecure Design

**Explicação:**  
Ambas as páginas buscam até 1.000 pedidos e 100 produtos via client-side:

```typescript
// dashboard/page.tsx:196-197
const { data: productsData } = useProducts({ limit: 100 })
const { data: ordersData } = useOrders({ limit: 1000 })

// analytics/page.tsx:348-349
const { data: ordersData } = useOrders({ limit: 1000 })
const { data: productsData } = useProducts({ limit: 100 })
```

Todos os KPIs, tendências, agrupamentos mensais/diários/horários e rankings de produtos são calculados no browser com `useMemo`. Problemas:

1. **Information leak:** `GET /api/products` retorna `costPrice` e `marginPercent` para admins. Esses campos chegam ao browser e são visíveis nas devtools/network.
2. **Performance:** 1.000 pedidos em uma request; com crescimento, o limite se tornará insuficiente.
3. **Escalabilidade:** Com 10.000+ pedidos históricos, o limite fixo de 1.000 torna os KPIs acumulados incorretos.

**Correção recomendada:** Criar `GET /api/admin/analytics/summary` e `GET /api/admin/dashboard/summary` com filtros de período server-side usando `groupBy` e `aggregate` do Prisma. Retornar apenas os totais calculados, não os registros brutos.

---

### [MÉDIA] #24 — Content-Security-Policy ausente

**Arquivo:** `next.config.ts`  
**Categoria:** OWASP A05 — Security Misconfiguration

**Explicação:**  
Os headers HTTP presentes são adequados (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, etc.), mas `Content-Security-Policy` está ausente. Sem CSP, um XSS bem-sucedido pode carregar scripts externos e exfiltrar dados mesmo com os outros headers presentes.

**Correção:**

```typescript
// next.config.ts — adicionar ao array securityHeaders:
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://api.dicebear.com https://picsum.photos",
    "connect-src 'self' https://api.cloudinary.com",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
},
```

> Nota: `unsafe-inline` para script pode ser removido progressivamente após eliminar inline scripts gerados pelo Next.js (substituindo por nonces via `next.config.ts` `nonce` support).

---

### [MÉDIA] #27 — Dashboard expõe `costPrice` no browser via `useProducts`

**Arquivo:** `app/admin/(protected)/dashboard/page.tsx` (linhas 201–204)  
**Categoria:** OWASP A02 — Information Disclosure

**Explicação:**  
O cálculo de "Valor Investido" é feito client-side:

```typescript
const investedValue = useMemo(
  () => (productsData?.data ?? []).reduce((sum, p) => sum + (p.costPrice ?? 0) * p.stock, 0),
  [productsData]
)
```

Para que `costPrice` esteja disponível no browser, o endpoint `GET /api/products` (chamado com sessão de admin) retorna o campo. Em cenários com múltiplos funcionários admin, as margens de custo de todos os produtos ficam acessíveis via devtools para qualquer admin.

**Correção:** Calcular `investedValue` server-side em um endpoint de resumo que retorna apenas o total, não os valores individuais de custo.

---

### [MÉDIA] #31 — `shippingCost` pode ser manipulado para valor mínimo acima de zero

**Arquivo:** `app/api/orders/route.ts` (linhas 118–126)  
**Categoria:** OWASP A04 — Insecure Design / Lógica de Negócio

**Explicação:**  
A validação server-side do frete cobre apenas o caso exato `shippingCost === 0`:

```typescript
// orders/route.ts linhas 118-126
if (orderData.deliveryType === 'DELIVERY' && shippingCost === 0) {
  // Valida apenas se shippingCost for exatamente 0
  // shippingCost: 0.01 (1 centavo) passa sem nenhuma validação
}
```

Um cliente pode submeter `shippingCost: 0.01` e o pedido é criado com frete de R$ 0,01 independente da cotação real.

**Impacto:** Pedidos com frete manipulado abaixo do custo real. O fix #7 foi parcialmente eficaz.

**Correção:**

```typescript
// Validação ampliada:
if (orderData.deliveryType === 'DELIVERY') {
  const freightConfig = await prisma.freightConfig.findFirst()
  const freeAbove = freightConfig?.freeAbove ?? null

  if (freeAbove !== null && subtotal >= freeAbove) {
    resolvedShippingCost = 0 // frete grátis legítimo
  } else if (shippingCost <= 0) {
    return badRequest('Custo de frete inválido para entrega')
  }
  // Para validação completa: recalcular via Melhor Envio com o CEP do pedido
}
```

---

### [MÉDIA] #30 — Frete calculado com peso/dimensões padrão, não por produto

**Arquivo:** `app/api/freight/calculate/route.ts` (linhas 58–65)  
**Categoria:** OWASP A04 — Insecure Design / Lógica de Negócio

**Explicação:**  
O cálculo de frete usa `defaultWeight`, `defaultHeight`, `defaultWidth`, `defaultLength` da `FreightConfig` para todos os pedidos, independentemente do conteúdo real do carrinho:

```typescript
package: {
  height: config.defaultHeight,   // sempre igual para qualquer pedido
  width: config.defaultWidth,
  length: config.defaultLength,
  weight: config.defaultWeight,
},
```

Os campos de dimensão existem no schema `Product` (`weight`, `length`, `width`, `height`) mas não são usados na cotação.

**Impacto:** Cotação de frete incorreta para produtos pesados/volumosos. Prejuízo na margem de frete ou preço incorreto apresentado ao cliente.

**Correção:** O endpoint deve receber os IDs dos produtos e quantidades, buscar dimensões reais no banco e acumular peso/volume antes de chamar a API do Melhor Envio.

---

### [BAIXA] #25 — `prettier-plugin-tailwindcss` em versão insiders

**Arquivo:** `package.json` (linha 79)  
**Categoria:** OWASP A06 — Vulnerable Components

**Explicação:**

```json
"prettier-plugin-tailwindcss": "^0.0.0-insiders.f7d2598"
```

Versões `insiders` são builds de desenvolvimento sem garantia de estabilidade ou auditoria de segurança. O range `^0.0.0-insiders.f7d2598` pode resolver para versões insiders futuras.

**Correção:**

```json
"prettier-plugin-tailwindcss": "^0.6.5"
```

---

### [BAIXA] #35 — Paginação ausente em `/api/expenses` e `/api/coupons`

**Arquivo:** `app/api/expenses/route.ts` (linha 39) · `app/api/coupons/route.ts` (linha 22)  
**Categoria:** Performance

**Explicação:**  
`GET /api/expenses` retorna todos os registros filtrados por mês sem limit/skip. `GET /api/coupons` retorna todos os cupons sem paginação. Com volumes crescentes de dados, essas queries podem sobrecarregar o banco.

**Correção:** Adicionar `page`, `limit`, `skip`, `take` nos dois endpoints seguindo o padrão já estabelecido em `/api/orders` e `/api/products`.

---

## Problemas Resolvidos

### #1 — Preço dos itens lido do banco

O campo `price` foi removido do `orderItemSchema` do cliente. Os preços são buscados via `prisma.product.findMany` por `productId` e o total é calculado server-side. Nenhum valor de preço do cliente é aceito ou usado.

### #2 e #10 — Cupom atômico com TOCTOU eliminado

Dupla validação: (a) pré-validação fora da transação para UX rápido; (b) re-leitura **dentro** da `$transaction` para valor autoritativo. O consumo usa `$executeRaw` com condição composta: `WHERE ... AND ("maxUses" IS NULL OR "usedCount" < "maxUses")` — só incrementa se ainda válido no momento exato da escrita.

### #3 — Upload restrito a ADMIN com validação de tipo e tamanho

`requireAdmin()` chamado antes de qualquer processamento. Tipos aceitos: `['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp']`. Tamanho máximo: 10MB verificado via `MAX_BASE64_LENGTH` antes de enviar ao Cloudinary.

### #4 — Estoque decrementado atomicamente

A transação usa `updateMany` com condição `stock: { gte: item.quantity }`. Se `count === 0`, lança erro e reverte a transação inteira, prevenindo stock negativo mesmo sob concorrência.

### #5 — Estoque restaurado no cancelamento

Ao aplicar `status: 'CANCELLED'`, a transação percorre `existing.items` e faz `increment` em `Product.stock` e `VariantSizeStock.stock` para todos os itens com `productId` não nulo e `color`/`size` presentes.

### #6 — Transições de status validadas

`VALID_TRANSITIONS` mapeado explicitamente: `PENDING→[PROCESSING,CANCELLED]`, `PROCESSING→[SHIPPED,CANCELLED]`, `SHIPPED→[DELIVERED,CANCELLED]`, `DELIVERED→[]`, `CANCELLED→[]`. Transições inválidas retornam 400.

### #7 — Frete grátis validado server-side (parcial)

Se `deliveryType === 'DELIVERY'` e `shippingCost === 0`, o servidor verifica `freightConfig.freeAbove`. Se o subtotal for menor que o limiar, retorna 400. Valores acima de zero não são validados (ver #31).

### #8 — SSRF no upload bloqueado

O upload só aceita strings que iniciem com prefixos de data URI válidos. Qualquer URL remota é rejeitada antes de chegar ao Cloudinary.

### #9 — Rate limiting

`/api/orders POST`: 5 pedidos/hora por IP. `/api/coupons/validate POST`: 20 tentativas/hora por IP. `/api/freight/calculate POST`: 10 cálculos/minuto por IP.

### #11 — Headers de segurança HTTP (parcial)

`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` aplicados globalmente. CSP ausente (ver #24).

### #12 — Dados financeiros excluídos do select público

`publicSelect` em `products/route.ts` e `products/[id]/route.ts` exclui `costPrice`, `marginPercent`, `supplierId`, `barcode` e `supplier`. Não-admins recebem apenas campos de catálogo.

### #13 — `requireAdmin()` em produtos

`POST /api/products`, `PUT /api/products/[id]`, `DELETE /api/products/[id]` e `POST /api/upload` usam `requireAdmin()`.

### #23 — `apiToken` do Melhor Envio removido do banco

Migration `20260626000008_remove_freight_apitoken` executa `ALTER TABLE "FreightConfig" DROP COLUMN IF EXISTS "apiToken"`. O token agora vem exclusivamente de `process.env.MELHOR_ENVIO_TOKEN`.

### #26 — Default de role corrigido para VIEWER

Migration `20260624000001` havia estabelecido default `ADMIN`. Migration `20260626000007` corrige: `ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VIEWER'`. Schema Prisma reflete `@default(VIEWER)`.

---

## Áreas sem Problemas

**Autenticação (Auth.js v5):** `src/auth.ts` implementa Credentials provider com bcrypt (rounds=12), validação via Zod antes de tocar o banco, e retorna apenas `id`, `name`, `email`, `role`. JWT e session callbacks propagam o role corretamente. Middleware `proxy.ts` protege todas as rotas `/admin/**`.

**Bootstrap de admin:** `src/lib/bootstrap.ts` só cria o admin se `user.count() === 0`, exige senha mínima de 12 caracteres, e não loga a senha em nenhum ponto.

**Injeção SQL:** Todas as queries usam o ORM Prisma (tipadas) ou `Prisma.sql` tagged templates com prepared statements parametrizados. A busca com `unaccent` em `products/route.ts` usa `Prisma.sql` + `Prisma.join`, sem interpolação de strings não sanitizadas.

**Slug de produto:** Gerado server-side, nunca aceito do cliente na criação. No `updateSchema`, pode ser atualizado por ADMIN (intencional).

**Barcode de produto:** Variantes usam sequência de banco (`barcode_seq`) via `nextBarcode()`, garantindo unicidade sequencial sem colisões. Produtos usam `crypto.randomUUID()` com entropia adequada.

**Configuração de imagens:** `next.config.ts` limita `remotePatterns` a domínios explícitos. Wildcard não está em uso.

**`db.ts` (Prisma singleton):** Padrão correto de singleton com `globalThis` para evitar múltiplas instâncias em hot-reload. Usa `PrismaPg` adapter com suporte a Neon (remoção de `channel_binding`).

**`auth-guard.ts`:** Dois níveis distintos bem tipados: `requireAuth()` para leitura autenticada, `requireAdmin()` para mutações privilegiadas. Discriminated union `AuthResult | AuthErrorResult` com TypeScript correto.

**Paginação nos endpoints principais:** `GET /api/orders`, `GET /api/products`, `GET /api/suppliers`, `GET /api/boletos` têm paginação com `limit` máximo de 100 e `page` mínimo de 1.

**Validação de input:** Todos os endpoints de mutação usam Zod com schemas estritos. Enums validados explicitamente (e.g., `PaymentMethod`, `OrderStatus`, `DeliveryType`).

**Logs de erro:** `internalError()` em produção registra apenas `ErrorType: message` sem stack trace. Em desenvolvimento, inclui `detail` no JSON. Dados sensíveis não aparecem nos logs.

---

## Nota de Produção

| Dimensão                 | Nota       | Justificativa                                                                                |
| ------------------------ | ---------- | -------------------------------------------------------------------------------------------- |
| Controle de Acesso (A01) | 5/10       | ADMIN/VIEWER distintos existem mas 11 endpoints de escrita não aplicam `requireAdmin()`      |
| Criptografia (A02)       | 8/10       | bcrypt rounds=12, JWT via Auth.js, dados financeiros excluídos do select público             |
| Injeção (A03)            | 9/10       | ORM + prepared statements; sem interpolação direta em queries raw                            |
| Design de Negócio (A04)  | 7/10       | Cupom atômico, estoque atômico, transições validadas; frete com peso padrão                  |
| Configuração (A05)       | 7/10       | Headers HTTP adequados exceto CSP ausente                                                    |
| Dependências (A06)       | 8/10       | Versões estáveis com exceção do prettier-plugin insiders                                     |
| Autenticação (A07)       | 8/10       | Rate limiting em endpoints críticos; rate limiter in-memory (não escala multi-instância)     |
| Validação de Input (A08) | 9/10       | Zod em todos os endpoints; enums Prisma tipados                                              |
| Logs (A09)               | 8/10       | Erro sanitizado em produção; sem dados sensíveis em logs                                     |
| SSRF (A10)               | 9/10       | Upload só aceita data URIs; fetch externo apenas ao Melhor Envio com token de ambiente       |
| **Média geral**          | **7.8/10** | **Operável com um único ADMIN; inseguro para criar usuários VIEWER antes dos fixes de role** |

---

## Plano de Ação Priorizado

### Prioridade 1 — Executar ANTES de criar qualquer usuário VIEWER

Substituir `auth()` + verificação genérica por `requireAdmin()` nos seguintes arquivos/métodos:

| Arquivo                                               | Métodos a corrigir |
| ----------------------------------------------------- | ------------------ |
| `app/api/suppliers/route.ts`                          | POST               |
| `app/api/suppliers/[id]/route.ts`                     | PUT, DELETE        |
| `app/api/boletos/route.ts`                            | POST               |
| `app/api/boletos/[id]/route.ts`                       | PATCH, DELETE      |
| `app/api/expenses/route.ts`                           | POST               |
| `app/api/expenses/[id]/route.ts`                      | DELETE             |
| `app/api/coupons/route.ts`                            | POST               |
| `app/api/coupons/[id]/route.ts`                       | PATCH, DELETE      |
| `app/api/products/[id]/variants/route.ts`             | POST               |
| `app/api/products/[id]/variants/[variantId]/route.ts` | PUT, DELETE        |
| `app/api/products/[id]/deduct-stock/route.ts`         | POST               |

### Prioridade 2 — Esta sprint

- Categorias, Marcas, Tipos de Produto: `POST`, `PUT`, `DELETE` → `requireAdmin()`
- Adicionar `Content-Security-Policy` em `next.config.ts`

### Prioridade 3 — Próximas sprints

- Mover KPIs do Dashboard/Analytics para endpoints server-side (eliminar `useOrders({ limit: 1000 })`)
- Corrigir validação de `shippingCost` para qualquer valor abaixo do custo real
- Adicionar peso/dimensões reais dos produtos na cotação de frete
- Adicionar paginação em `/api/expenses` e `/api/coupons`
- Substituir `prettier-plugin-tailwindcss` insiders por versão estável

---

_Auditoria realizada com leitura direta de todos os arquivos listados. Nenhuma suposição foi feita sobre comportamento não verificado no código-fonte._
