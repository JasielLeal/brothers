/**
 * Seed de demonstração — ADITIVO e IDEMPOTENTE.
 * Nunca apaga nada: usa upsert por slug/código e marca pedidos/despesas com "[demo]".
 * Pode ser executado várias vezes sem duplicar dados.
 *
 * Uso: npm run seed-demo
 */
import { config } from 'dotenv'
config({ quiet: true })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const cs = (process.env.DATABASE_URL ?? '').replace(/&?channel_binding=[^&]*/g, '')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: cs }) })

const U = (id: string) => `https://images.unsplash.com/photo-${id}?w=600&q=80`

const CLOTHING = ['P', 'M', 'G', 'GG']
const SHOE = ['38', '39', '40', '41', '42', '43']
const UNIQUE = ['Único']

const COLOR = {
  preto: { colorName: 'Preto', colorHex: '#111111' },
  branco: { colorName: 'Branco', colorHex: '#F5F5F5' },
  cinza: { colorName: 'Cinza', colorHex: '#6b7280' },
  azul: { colorName: 'Azul Marinho', colorHex: '#1e3a5f' },
  verde: { colorName: 'Verde', colorHex: '#16a34a' },
  bege: { colorName: 'Bege', colorHex: '#d4b896' },
  vermelho: { colorName: 'Vermelho', colorHex: '#dc2626' },
  rosa: { colorName: 'Rosa', colorHex: '#ec4899' },
}
type ColorKey = keyof typeof COLOR

const CATEGORIES = [
  { name: 'Camisetas', slug: 'camisetas', sizeSet: 'CLOTHING', showInNav: true },
  { name: 'Calças', slug: 'calcas', sizeSet: 'CLOTHING', showInNav: true },
  { name: 'Moletons', slug: 'moletons', sizeSet: 'CLOTHING', showInNav: true },
  { name: 'Jaquetas', slug: 'jaquetas', sizeSet: 'CLOTHING', showInNav: true },
  { name: 'Tênis', slug: 'tenis', sizeSet: 'SHOE', showInNav: true },
  { name: 'Acessórios', slug: 'acessorios', sizeSet: 'UNIQUE', showInNav: true },
] as const

const BRANDS = [
  ['Nike', 'nike'],
  ['Adidas', 'adidas'],
  ['Puma', 'puma'],
  ['New Balance', 'new-balance'],
  ['Under Armour', 'under-armour'],
  ['Lacoste', 'lacoste'],
] as const

const TYPES = [
  ['Casual', 'casual'],
  ['Esportivo', 'esportivo'],
  ['Premium', 'premium'],
] as const

const SUPPLIERS = [
  {
    name: 'Distribuidora Sul Esportes',
    contactName: 'Marcos Almeida',
    email: 'contato@sulesportes.demo',
    phone: '(51) 99999-1001',
    cnpj: '11.111.111/0001-11',
    categories: ['camisetas', 'calcas', 'moletons'],
  },
  {
    name: 'Calçados & Cia Atacado',
    contactName: 'Fernanda Lopes',
    email: 'vendas@calcadosecia.demo',
    phone: '(19) 98888-2002',
    cnpj: '22.222.222/0001-22',
    categories: ['tenis'],
  },
  {
    name: 'Urban Wear Confecções',
    contactName: 'Rafael Nunes',
    email: 'rafael@urbanwear.demo',
    phone: '(11) 97777-3003',
    cnpj: '33.333.333/0001-33',
    categories: ['jaquetas', 'acessorios'],
  },
]

type P = {
  name: string
  slug: string
  cat: (typeof CATEGORIES)[number]['slug']
  brand: string
  type: string
  supplier: number
  price: number
  orig?: number
  featured?: boolean
  img: string[]
  colors: ColorKey[]
  desc: string
}

const PRODUCTS: P[] = [
  // Camisetas
  {
    name: 'Camiseta Nike Dri-FIT Básica',
    slug: 'demo-camiseta-nike-dri-fit',
    cat: 'camisetas',
    brand: 'nike',
    type: 'esportivo',
    supplier: 0,
    price: 129.9,
    orig: 159.9,
    featured: true,
    img: ['1521572163474-6864f9cf17ab', '1583743814966-8936f5b7be1a'],
    colors: ['preto', 'branco', 'azul'],
    desc: 'Camiseta leve com tecnologia Dri-FIT para treinos de alta performance.',
  },
  {
    name: 'Camiseta Adidas Originals Trefoil',
    slug: 'demo-camiseta-adidas-trefoil',
    cat: 'camisetas',
    brand: 'adidas',
    type: 'casual',
    supplier: 0,
    price: 109.9,
    orig: 139.9,
    img: ['1622445275463-afa2ab738c34', '1562157873-818bc0726f68'],
    colors: ['branco', 'preto', 'verde'],
    desc: 'O trevo Originals em algodão premium, caimento confortável.',
  },
  {
    name: 'Camiseta Puma Essentials Logo',
    slug: 'demo-camiseta-puma-essentials',
    cat: 'camisetas',
    brand: 'puma',
    type: 'casual',
    supplier: 0,
    price: 89.9,
    img: ['1503341733017-1901578f9f1e', '1576566588028-4147f3842f27'],
    colors: ['cinza', 'vermelho'],
    desc: 'Camiseta básica com logo bordado no peito.',
  },
  {
    name: 'Camiseta Lacoste Polo Sport',
    slug: 'demo-camiseta-lacoste-polo',
    cat: 'camisetas',
    brand: 'lacoste',
    type: 'premium',
    supplier: 0,
    price: 299.9,
    orig: 379.9,
    featured: true,
    img: ['1571945153237-4929e783af4a', '1529374255404-311a2a4f1fd9'],
    colors: ['branco', 'azul'],
    desc: 'Polo técnica premium com o clássico crocodilo bordado.',
  },
  // Calças
  {
    name: 'Calça Nike Tech Fleece',
    slug: 'demo-calca-nike-tech-fleece',
    cat: 'calcas',
    brand: 'nike',
    type: 'premium',
    supplier: 0,
    price: 399.9,
    orig: 479.9,
    featured: true,
    img: ['1542272604-787c3835535d', '1509551388413-e18d0ac5d495'],
    colors: ['preto', 'cinza'],
    desc: 'Moletom Tech Fleece moderno, quente e leve.',
  },
  {
    name: 'Calça Adidas Tiro Training',
    slug: 'demo-calca-adidas-tiro',
    cat: 'calcas',
    brand: 'adidas',
    type: 'esportivo',
    supplier: 0,
    price: 219.9,
    orig: 269.9,
    img: ['1473966968600-fa801b869a1a', '1594938298603-c8148c4dae35'],
    colors: ['preto', 'azul'],
    desc: 'Calça de treino com ajuste cônico e bolsos com zíper.',
  },
  {
    name: 'Calça Puma Jogger Casual',
    slug: 'demo-calca-puma-jogger',
    cat: 'calcas',
    brand: 'puma',
    type: 'casual',
    supplier: 0,
    price: 169.9,
    img: ['1624378439575-d8705ad7ae80', '1604176354204-9268737828e4'],
    colors: ['cinza', 'bege', 'preto'],
    desc: 'Jogger leve e versátil para o dia a dia.',
  },
  // Moletons
  {
    name: 'Moletom Nike Club Fleece',
    slug: 'demo-moletom-nike-club',
    cat: 'moletons',
    brand: 'nike',
    type: 'casual',
    supplier: 0,
    price: 249.9,
    orig: 299.9,
    featured: true,
    img: ['1556821840-3a63f15732ce', '1578681994506-b8f463449011'],
    colors: ['preto', 'cinza', 'bege'],
    desc: 'Moletom com capuz em algodão macio.',
  },
  {
    name: 'Moletom Adidas Originals',
    slug: 'demo-moletom-adidas-originals',
    cat: 'moletons',
    brand: 'adidas',
    type: 'casual',
    supplier: 0,
    price: 259.9,
    orig: 319.9,
    img: ['1515886657613-9f3515b0c78f', '1434389677669-e08b4cac3105'],
    colors: ['verde', 'preto'],
    desc: 'Moletom clássico com trevo Originals.',
  },
  {
    name: 'Moletom Under Armour Rival',
    slug: 'demo-moletom-ua-rival',
    cat: 'moletons',
    brand: 'under-armour',
    type: 'esportivo',
    supplier: 0,
    price: 299.9,
    orig: 359.9,
    img: ['1503342217505-b0a15ec3261c', '1521223890158-f9f7c3d5d504'],
    colors: ['cinza', 'azul'],
    desc: 'Fleece pesado para os dias mais frios.',
  },
  // Jaquetas
  {
    name: 'Jaqueta Nike Windrunner',
    slug: 'demo-jaqueta-nike-windrunner',
    cat: 'jaquetas',
    brand: 'nike',
    type: 'premium',
    supplier: 2,
    price: 599.9,
    orig: 749.9,
    featured: true,
    img: ['1591047139829-d91aecb6caea', '1551028719-00167b16eac5'],
    colors: ['preto', 'azul'],
    desc: 'A icônica Windrunner, proteção contra vento e garoa.',
  },
  {
    name: 'Jaqueta Adidas Tiro',
    slug: 'demo-jaqueta-adidas-tiro',
    cat: 'jaquetas',
    brand: 'adidas',
    type: 'esportivo',
    supplier: 2,
    price: 299.9,
    orig: 369.9,
    img: ['1544966503-7cc5ac882d5f', '1607345366928-199ea26cfe3e'],
    colors: ['preto', 'vermelho'],
    desc: 'Jaqueta de treino com bolsos com zíper.',
  },
  {
    name: 'Jaqueta Lacoste Bomber',
    slug: 'demo-jaqueta-lacoste-bomber',
    cat: 'jaquetas',
    brand: 'lacoste',
    type: 'premium',
    supplier: 2,
    price: 799.9,
    orig: 999.9,
    featured: true,
    img: ['1601762603339-fd61e28b698a', '1614975059251-992f11792b9f'],
    colors: ['bege', 'verde'],
    desc: 'Bomber premium com logo bordado.',
  },
  // Tênis
  {
    name: 'Tênis Nike Air Force 1',
    slug: 'demo-tenis-nike-air-force-1',
    cat: 'tenis',
    brand: 'nike',
    type: 'premium',
    supplier: 1,
    price: 699.9,
    orig: 849.9,
    featured: true,
    img: ['1542291026-7eec264c27ff', '1600185365926-3a2ce3cdb9eb'],
    colors: ['branco', 'preto'],
    desc: 'O Air Force 1 original, ícone da cultura sneaker.',
  },
  {
    name: 'Tênis Adidas Ultraboost',
    slug: 'demo-tenis-adidas-ultraboost',
    cat: 'tenis',
    brand: 'adidas',
    type: 'esportivo',
    supplier: 1,
    price: 899.9,
    orig: 1099.9,
    featured: true,
    img: ['1608231387042-66d1773070a5', '1603487742131-4160ec999306'],
    colors: ['preto', 'cinza'],
    desc: 'Tecnologia Boost com retorno de energia para corredores.',
  },
  {
    name: 'Tênis Puma Suede Classic',
    slug: 'demo-tenis-puma-suede',
    cat: 'tenis',
    brand: 'puma',
    type: 'casual',
    supplier: 1,
    price: 429.9,
    orig: 529.9,
    img: ['1491553895911-0055eca6402d', '1539185441755-769473a23570'],
    colors: ['vermelho', 'azul'],
    desc: 'O Suede clássico em camurça premium.',
  },
  {
    name: 'Tênis New Balance 574',
    slug: 'demo-tenis-new-balance-574',
    cat: 'tenis',
    brand: 'new-balance',
    type: 'casual',
    supplier: 1,
    price: 549.9,
    orig: 679.9,
    img: ['1460353581641-37baddab0fa2', '1525966222134-fcfa99b8ae77'],
    colors: ['cinza', 'verde'],
    desc: 'O clássico 574 com amortecimento ENCAP.',
  },
  {
    name: 'Tênis Nike Revolution 6',
    slug: 'demo-tenis-nike-revolution-6',
    cat: 'tenis',
    brand: 'nike',
    type: 'esportivo',
    supplier: 1,
    price: 329.9,
    orig: 399.9,
    img: ['1595950653106-6c9ebd614d3a', '1607522370275-f14206abe5d3'],
    colors: ['preto', 'rosa'],
    desc: 'Tênis de corrida leve e macio para o dia a dia.',
  },
  // Acessórios
  {
    name: 'Boné Nike Dri-FIT',
    slug: 'demo-bone-nike-dri-fit',
    cat: 'acessorios',
    brand: 'nike',
    type: 'esportivo',
    supplier: 2,
    price: 89.9,
    orig: 109.9,
    img: ['1588850561407-ed78c282e89b', '1553062407-98eeb64c6a62'],
    colors: ['preto', 'branco', 'azul'],
    desc: 'Boné com aba curva e tecnologia Dri-FIT.',
  },
  {
    name: 'Mochila Adidas Classic',
    slug: 'demo-mochila-adidas-classic',
    cat: 'acessorios',
    brand: 'adidas',
    type: 'casual',
    supplier: 2,
    price: 199.9,
    orig: 249.9,
    featured: true,
    img: ['1586350977771-b3b0abd50c82', '1548369937-47519962c11a'],
    colors: ['preto', 'cinza'],
    desc: 'Mochila com compartimento para notebook.',
  },
  {
    name: 'Pochete Nike Heritage',
    slug: 'demo-pochete-nike-heritage',
    cat: 'acessorios',
    brand: 'nike',
    type: 'casual',
    supplier: 2,
    price: 129.9,
    img: ['1591360236480-4ed4b4f3fd6e', '1571019613454-1cb2f99b2d8b'],
    colors: ['preto', 'bege'],
    desc: 'Pochete com compartimento principal e bolso frontal.',
  },
  {
    name: 'Relógio Digital Sport',
    slug: 'demo-relogio-digital-sport',
    cat: 'acessorios',
    brand: 'under-armour',
    type: 'esportivo',
    supplier: 2,
    price: 299.9,
    orig: 399.9,
    img: ['1523275335684-37898b6baf30', '1523779105320-d1cd346ff52b'],
    colors: ['preto'],
    desc: 'Relógio digital resistente à água com cronômetro.',
  },
]

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const daysAgo = (n: number, hour = 12) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(hour, rand(0, 59), 0, 0)
  return d
}
const round2 = (n: number) => Math.round(n * 100) / 100

async function main() {
  // ── Catálogo base ──────────────────────────────────────────────────────────
  console.log('🌱 Categorias, marcas e tipos...')
  const cat: Record<string, string> = {}
  for (const c of CATEGORIES) {
    const r = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, hasVariants: true },
    })
    cat[c.slug] = r.id
  }
  const brand: Record<string, string> = {}
  for (const [name, slug] of BRANDS) {
    brand[slug] = (
      await prisma.brand.upsert({ where: { slug }, update: {}, create: { name, slug } })
    ).id
  }
  const type: Record<string, string> = {}
  for (const [name, slug] of TYPES) {
    type[slug] = (
      await prisma.productType.upsert({ where: { slug }, update: {}, create: { name, slug } })
    ).id
  }

  // ── Fornecedores ───────────────────────────────────────────────────────────
  console.log('🌱 Fornecedores...')
  const supplierIds: string[] = []
  for (const s of SUPPLIERS) {
    const r = await prisma.supplier.upsert({ where: { cnpj: s.cnpj }, update: {}, create: s })
    supplierIds.push(r.id)
  }

  // ── Produtos + variantes ───────────────────────────────────────────────────
  console.log('🌱 Produtos...')
  let newProducts = 0
  for (const p of PRODUCTS) {
    const exists = await prisma.product.findUnique({ where: { slug: p.slug } })
    if (exists) continue

    const sizes = p.cat === 'tenis' ? SHOE : p.cat === 'acessorios' ? UNIQUE : CLOTHING
    const variants = p.colors.map((ck) => ({
      ...COLOR[ck],
      images: p.img.map(U),
      sizes: { create: sizes.map((size) => ({ size, stock: rand(0, 3) === 0 ? 0 : rand(2, 20) })) },
    }))
    const stock = variants.reduce((a, v) => a + v.sizes.create.reduce((s, z) => s + z.stock, 0), 0)
    const costPrice = round2(p.price * 0.45)

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.desc,
        price: p.price,
        originalPrice: p.orig ?? null,
        costPrice,
        marginPercent: round2(((p.price - costPrice) / costPrice) * 100),
        images: p.img.map(U),
        stock,
        rating: round2(3.8 + Math.random() * 1.2),
        reviewsCount: rand(3, 240),
        isActive: true,
        isFeatured: p.featured ?? false,
        weight: p.cat === 'tenis' ? 0.9 : 0.4,
        length: 30,
        width: 20,
        height: 10,
        categoryId: cat[p.cat],
        brandId: brand[p.brand],
        typeId: type[p.type],
        supplierId: supplierIds[p.supplier],
        variants: { create: variants },
      },
    })
    newProducts++
  }
  console.log(`   ✓ ${newProducts} novos (${PRODUCTS.length - newProducts} já existiam)`)

  // ── Cupons ─────────────────────────────────────────────────────────────────
  console.log('🌱 Cupons...')
  const inDays = (n: number) => daysAgo(-n)
  const coupons = [
    {
      code: 'BEMVINDO10',
      type: 'PERCENTAGE',
      value: 10,
      minOrderValue: 100,
      maxUses: 200,
      usedCount: 34,
      expiresAt: inDays(60),
    },
    {
      code: 'FRETE20',
      type: 'FIXED',
      value: 20,
      minOrderValue: 250,
      maxUses: 100,
      usedCount: 12,
      expiresAt: inDays(30),
    },
    {
      code: 'BLACK25',
      type: 'PERCENTAGE',
      value: 25,
      minOrderValue: 400,
      maxUses: 50,
      usedCount: 50,
      expiresAt: daysAgo(10),
      isActive: false,
    },
    { code: 'LEVE3PAGUE2', type: 'PERCENTAGE', value: 15, minQuantity: 3, expiresAt: null },
  ] as const
  for (const c of coupons) {
    await prisma.coupon.upsert({ where: { code: c.code }, update: {}, create: { ...c } })
  }

  // ── Frete ──────────────────────────────────────────────────────────────────
  if ((await prisma.freightConfig.count()) === 0) {
    await prisma.freightConfig.create({ data: { originCep: '01310100', freeAbove: 350 } })
  }

  // ── Boletos ────────────────────────────────────────────────────────────────
  console.log('🌱 Boletos...')
  const boletos = [
    {
      code: 'DEMO-BOL-001',
      s: 0,
      description: 'Lote camisetas outono',
      amount: 3480.5,
      due: daysAgo(-5),
      status: 'PENDING',
    },
    {
      code: 'DEMO-BOL-002',
      s: 1,
      description: 'Pedido tênis running',
      amount: 7250,
      due: daysAgo(-12),
      status: 'PENDING',
    },
    {
      code: 'DEMO-BOL-003',
      s: 2,
      description: 'Jaquetas inverno',
      amount: 5120.9,
      due: daysAgo(6),
      status: 'OVERDUE',
    },
    {
      code: 'DEMO-BOL-004',
      s: 0,
      description: 'Reposição calças',
      amount: 2890,
      due: daysAgo(20),
      status: 'PAID',
      paid: daysAgo(21),
    },
    {
      code: 'DEMO-BOL-005',
      s: 1,
      description: 'Pedido tênis lifestyle',
      amount: 4310.75,
      due: daysAgo(35),
      status: 'PAID',
      paid: daysAgo(36),
    },
    {
      code: 'DEMO-BOL-006',
      s: 2,
      description: 'Acessórios — pedido cancelado',
      amount: 980,
      due: daysAgo(15),
      status: 'CANCELLED',
    },
  ] as const
  for (const b of boletos) {
    await prisma.boleto.upsert({
      where: { code: b.code },
      update: {},
      create: {
        code: b.code,
        supplierId: supplierIds[b.s],
        supplierName: SUPPLIERS[b.s].name,
        description: b.description,
        amount: b.amount,
        dueDate: b.due,
        paidAt: 'paid' in b ? b.paid : null,
        status: b.status,
      },
    })
  }

  // ── Despesas ───────────────────────────────────────────────────────────────
  console.log('🌱 Despesas...')
  if ((await prisma.expense.count({ where: { notes: { startsWith: '[demo]' } } })) === 0) {
    const expenses = [
      ['Aluguel da loja', 4500, 'RENT', 28],
      ['Conta de energia', 612.4, 'UTILITIES', 22],
      ['Internet e telefone', 249.9, 'UTILITIES', 20],
      ['Salário vendedora', 2200, 'SALARIES', 18],
      ['Sacolas e embalagens', 385, 'SUPPLIES', 14],
      ['Anúncios Instagram', 800, 'MARKETING', 10],
      ['Manutenção ar-condicionado', 350, 'MAINTENANCE', 7],
      ['Material de escritório', 120, 'OTHER', 3],
    ] as const
    for (const [description, amount, category, ago] of expenses) {
      await prisma.expense.create({
        data: {
          description,
          amount,
          category,
          date: daysAgo(ago),
          notes: '[demo] despesa de exemplo',
        },
      })
    }
  }

  // ── Pedidos ────────────────────────────────────────────────────────────────
  console.log('🌱 Pedidos...')
  if ((await prisma.order.count({ where: { notes: { startsWith: '[demo]' } } })) === 0) {
    const products = await prisma.product.findMany({
      where: { slug: { startsWith: 'demo-' } },
      include: { variants: { include: { sizes: true } } },
    })
    const customers = [
      ['Ana Souza', '(11) 98111-0001'],
      ['Bruno Lima', '(21) 98222-0002'],
      ['Carla Mendes', '(31) 98333-0003'],
      ['Diego Rocha', '(41) 98444-0004'],
      ['Elisa Prado', '(51) 98555-0005'],
      ['Felipe Costa', '(61) 98666-0006'],
      ['Gabriela Alves', '(71) 98777-0007'],
      ['Henrique Dias', '(81) 98888-0008'],
    ]
    const statuses = [
      'DELIVERED',
      'DELIVERED',
      'DELIVERED',
      'SHIPPED',
      'PROCESSING',
      'PENDING',
      'CANCELLED',
      'DELIVERED',
      'PENDING',
      'DELIVERED',
      'SHIPPED',
      'DELIVERED',
    ] as const
    const payments = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'] as const
    const cities = [
      ['São Paulo', 'SP', '01310100'],
      ['Rio de Janeiro', 'RJ', '20040020'],
      ['Belo Horizonte', 'MG', '30130010'],
      ['Curitiba', 'PR', '80010000'],
    ]

    for (let i = 0; i < statuses.length; i++) {
      const [customerName, customerPhone] = customers[i % customers.length]
      const delivery = i % 4 === 3 ? 'PICKUP' : 'DELIVERY'
      const [city, state, zipCode] = cities[i % cities.length]

      const items = Array.from({ length: rand(1, 3) }, () => {
        const prod = products[rand(0, products.length - 1)]
        const variant = prod.variants[rand(0, prod.variants.length - 1)]
        const size = variant.sizes[rand(0, variant.sizes.length - 1)]
        return { prod, variant, size, quantity: rand(1, 2) }
      })

      const subtotal = items.reduce((a, it) => a + it.prod.price * it.quantity, 0)
      const useCoupon = i % 5 === 0
      const discountAmount = useCoupon ? round2(subtotal * 0.1) : 0
      const shippingCost = delivery === 'DELIVERY' && subtotal < 350 ? 24.9 : 0
      const createdAt = daysAgo(Math.floor((i * 28) / statuses.length) + rand(0, 1), rand(9, 20))

      await prisma.order.create({
        data: {
          customerName,
          customerPhone,
          paymentMethod: payments[i % payments.length],
          deliveryType: delivery,
          status: statuses[i],
          total: round2(subtotal - discountAmount + shippingCost),
          discountAmount,
          couponCode: useCoupon ? 'BEMVINDO10' : null,
          shippingService: shippingCost > 0 ? 'PAC' : null,
          shippingCost,
          street: delivery === 'DELIVERY' ? `Rua das Flores, ${rand(10, 900)}` : null,
          city: delivery === 'DELIVERY' ? city : null,
          state: delivery === 'DELIVERY' ? state : null,
          zipCode: delivery === 'DELIVERY' ? zipCode : null,
          notes: '[demo] pedido de exemplo',
          createdAt,
          items: {
            create: items.map((it) => ({
              productId: it.prod.id,
              productName: it.prod.name,
              quantity: it.quantity,
              price: it.prod.price,
              size: it.size.size,
              color: it.variant.colorName,
            })),
          },
        },
      })
    }
  }

  console.log('\n✅ Seed de demonstração concluído.')
  console.log({
    products: await prisma.product.count(),
    categories: await prisma.category.count(),
    brands: await prisma.brand.count(),
    suppliers: await prisma.supplier.count(),
    coupons: await prisma.coupon.count(),
    boletos: await prisma.boleto.count(),
    expenses: await prisma.expense.count(),
    orders: await prisma.order.count(),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
