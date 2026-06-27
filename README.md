# Brothers Outlet — Frontend

E-commerce de moda premium com painel administrativo completo, construído com Next.js 16 App Router.

---

## Stack

| Camada         | Tecnologia                     |
| -------------- | ------------------------------ |
| Framework      | Next.js 16.2.4 (Turbopack)     |
| Linguagem      | TypeScript 5                   |
| Estilização    | Tailwind CSS v4                |
| Banco de dados | PostgreSQL (Neon) via Prisma 7 |
| Autenticação   | Auth.js v5 (NextAuth)          |
| Estado global  | Zustand v5                     |
| Requisições    | TanStack Query v5 + Axios      |
| Formulários    | React Hook Form + Zod v4       |
| Animações      | Framer Motion v12              |
| Imagens        | Cloudinary                     |
| UI Primitives  | Radix UI + Lucide React        |

---

## Funcionalidades

### Loja (cliente)

- **Home** — hero animado, seções de mais vendidos, populares e novidades, categorias com marquee
- **Busca** — pesquisa por nome, marca, categoria e tipo com suporte a acentuação (PostgreSQL `unaccent`)
- **Produto** — galeria de imagens, variações, preço "De/Por", adicionar ao carrinho e favoritos
- **Carrinho** — controle de quantidade, progresso de frete grátis e resumo
- **Checkout** — formulário completo (entrega/retirada, pagamento, cupom de desconto)
- **Favoritos** — wishlist persistida no localStorage via Zustand
- **WhatsApp** — botão flutuante de contato
- **Comprovante** — página de sucesso com detalhes do pedido

### Painel Admin (`/admin`)

- **Dashboard** — KPIs (receita, pedidos, ticket médio, estoque investido), gráfico de receita por dia e pedidos semanais com comparativo do mês anterior
- **Pedidos** — listagem com filtros por status, drawer de detalhes, confirmação/cancelamento, impressão de comprovante A4
- **Produtos** — CRUD completo com upload de imagens para Cloudinary, drag-and-drop de ordem, calculadora de margem, código de barras EAN-13
- **Cupons** — CRUD com tipo percentual ou fixo, limite de usos, validade e controle de uso
- **Categorias** — CRUD de categorias, marcas e tipos de produto
- **Fornecedores** — cadastro e gestão de fornecedores com CNPJ
- **Boletos** — controle de contas a pagar por fornecedor com status (pendente/pago/vencido/cancelado)
- **Financeiro** — registro de despesas por categoria com gráficos de evolução mensal
- **Analytics** — análise de receita, ticket médio e produtos mais vendidos
- **Usuários** — listagem dos administradores cadastrados

---

## Estrutura do Projeto

```
app/
├── (auth)/login/               # Login do cliente
├── (shop)/                     # Grupo da loja pública
│   ├── layout.tsx              # Navbar + Footer + WhatsApp
│   ├── page.tsx                # Home
│   ├── cart/                   # Carrinho
│   ├── checkout/               # Checkout + Sucesso
│   ├── product/[id]/           # Detalhe do produto
│   ├── search/                 # Busca com filtros
│   ├── categoria/[slug]/       # Listagem por categoria
│   └── favoritos/              # Wishlist
├── admin/
│   ├── login/                  # Login do admin
│   └── (protected)/            # Rotas protegidas
│       ├── dashboard/
│       ├── orders/
│       ├── products/
│       ├── cupons/
│       ├── suppliers/
│       ├── invoices/
│       ├── financeiro/
│       ├── analytics/
│       └── users/
└── api/                        # Route Handlers (REST API)
    ├── auth/[...nextauth]/
    ├── products/
    ├── categories/
    ├── brands/
    ├── product-types/
    ├── orders/
    ├── coupons/validate/
    ├── suppliers/
    ├── boletos/
    ├── expenses/
    └── catalog/nav/

src/
├── auth.ts                     # Configuração NextAuth
├── auth.config.ts              # Callbacks JWT/Session/Authorized
├── features/                   # Módulos por domínio
│   ├── auth/
│   ├── cart/
│   ├── products/
│   ├── orders/
│   ├── coupons/
│   ├── suppliers/
│   ├── boletos/
│   ├── financeiro/
│   └── wishlist/
├── components/
│   ├── layout/                 # Navbar, Footer, AdminSidebar
│   ├── ui/                     # Primitivos (Button, Input, Card…)
│   └── providers/              # QueryClient, SessionProvider
└── lib/
    └── db.ts                   # Cliente Prisma singleton

prisma/
├── schema.prisma               # Modelos do banco
└── migrations/                 # Histórico de migrações

scripts/
├── seed-admin.ts               # Cria o usuário administrador
└── seed-products.ts            # Popula produtos de exemplo

proxy.ts                        # Proteção de rotas (Next.js 16)
instrumentation.ts              # Bootstrap automático do admin
```

---

## Banco de Dados

### Modelos

| Modelo                               | Descrição                                               |
| ------------------------------------ | ------------------------------------------------------- |
| `User`                               | Administradores do sistema                              |
| `Product`                            | Produtos com imagens, estoque, preço de custo e margem  |
| `Category` / `Brand` / `ProductType` | Catálogo                                                |
| `Order` + `OrderItem`                | Pedidos com cupom e desconto                            |
| `Coupon`                             | Cupons percentuais ou de valor fixo com controle de uso |
| `Supplier`                           | Fornecedores                                            |
| `Boleto`                             | Contas a pagar vinculadas a fornecedores                |
| `Expense`                            | Despesas operacionais categorizadas                     |

### Busca com acentuação

A extensão `unaccent` do PostgreSQL está habilitada. Buscas usam `unaccent(lower(campo)) ILIKE unaccent(lower(termo))`, permitindo encontrar "Boné" ao digitar "bone".

---

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz:

```env
# Banco de dados (Neon PostgreSQL)
DATABASE_URL="postgresql://..."

# Auth.js
AUTH_SECRET="sua-chave-secreta"

# Usuário administrador inicial
ADMIN_NAME="Seu Nome"
ADMIN_EMAIL="admin@email.com"
ADMIN_PASSWORD="senha-segura"

# Cloudinary (upload de imagens)
# cloud_name pode ser NEXT_PUBLIC (aparece nas URLs), API_KEY e API_SECRET NUNCA
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="seu-cloud-name"
CLOUDINARY_API_KEY="sua-api-key"
CLOUDINARY_API_SECRET="seu-api-secret"
```

---

## Setup Local

```bash
# Instalar dependências
npm install

# Aplicar migrações do banco
npx prisma migrate deploy

# Criar usuário admin (requer ADMIN_* no .env)
npx tsx scripts/seed-admin.ts

# (Opcional) Popular produtos de exemplo
npx tsx scripts/seed-products.ts

# Rodar em desenvolvimento
npm run dev
```

Acesse em `http://localhost:3000` e o painel em `http://localhost:3000/admin`.

---

## Deploy (Vercel)

1. Conecte o repositório na Vercel
2. Configure as variáveis de ambiente no painel da Vercel
3. O build executa `prisma generate && next build` automaticamente
4. O `instrumentation.ts` cria o admin na primeira inicialização se não existir

---

## Autenticação

Auth.js v5 com credenciais (e-mail + senha com bcryptjs). O arquivo `proxy.ts` (equivalente ao middleware do Next.js ≤15) protege todas as rotas `/admin/*`, redirecionando para `/admin/login` se não autenticado.

Para criar o primeiro admin em produção, configure as variáveis `ADMIN_*` — o `instrumentation.ts` cria automaticamente na primeira inicialização, ou execute manualmente `npx tsx scripts/seed-admin.ts`.

---

## Padrões de Código

- Respostas de API padronizadas com helpers: `ok()`, `created()`, `badRequest()`, `notFound()`, `internalError()`
- Paginação em todas as listagens via `page` + `limit`
- Validação com Zod em todos os endpoints e formulários
- Imagens enviadas em base64 para a API, armazenadas no Cloudinary e URLs salvas no banco
