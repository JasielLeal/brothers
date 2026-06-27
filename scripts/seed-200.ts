import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { v2 as cloudinary } from 'cloudinary'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ─── Upload helpers ───────────────────────────────────────────────────────────

const uploadCache = new Map<string, string>()

async function uploadImg(picsumUrl: string): Promise<string> {
  if (uploadCache.has(picsumUrl)) return uploadCache.get(picsumUrl)!
  const result = await cloudinary.uploader.upload(picsumUrl, {
    folder: 'brothers-outlet/products',
    resource_type: 'image',
    transformation: [{ quality: 'auto', fetch_format: 'auto', width: 800, crop: 'limit' }],
  })
  uploadCache.set(picsumUrl, result.secure_url)
  return result.secure_url
}

// Controlled concurrency — upload N at a time
async function uploadBatch(urls: string[], concurrency = 6): Promise<string[]> {
  const results: string[] = []
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const done = await Promise.all(batch.map(uploadImg))
    results.push(...done)
  }
  return results
}

// ─── Data palette ─────────────────────────────────────────────────────────────

const COLORS = [
  { name: 'Preto', hex: '#111111' },
  { name: 'Branco', hex: '#F5F5F5' },
  { name: 'Azul Royal', hex: '#1a3bcc' },
  { name: 'Vermelho', hex: '#dc2626' },
  { name: 'Verde', hex: '#16a34a' },
  { name: 'Cinza', hex: '#6b7280' },
  { name: 'Laranja', hex: '#ea580c' },
  { name: 'Rosa', hex: '#ec4899' },
  { name: 'Amarelo', hex: '#eab308' },
  { name: 'Azul Marinho', hex: '#1e3a5f' },
  { name: 'Bege', hex: '#d4b896' },
  { name: 'Bordô', hex: '#7f1d1d' },
  { name: 'Roxo', hex: '#7c3aed' },
  { name: 'Chumbo', hex: '#374151' },
]

const SIZES_ALL = ['PP', 'P', 'M', 'G', 'GG', 'XGG'] as const

const CATEGORIES = [
  { name: 'Camisetas', slug: 'camisetas' },
  { name: 'Calças', slug: 'calcas' },
  { name: 'Shorts', slug: 'shorts' },
  { name: 'Moletons', slug: 'moletons' },
  { name: 'Jaquetas', slug: 'jaquetas' },
  { name: 'Tênis', slug: 'tenis' },
  { name: 'Acessórios', slug: 'acessorios' },
  { name: 'Bermudas', slug: 'bermudas' },
]

const BRANDS = [
  { name: 'Nike', slug: 'nike' },
  { name: 'Adidas', slug: 'adidas' },
  { name: 'Puma', slug: 'puma' },
  { name: 'New Balance', slug: 'new-balance' },
  { name: 'Under Armour', slug: 'under-armour' },
  { name: 'Fila', slug: 'fila' },
  { name: 'Oakley', slug: 'oakley' },
  { name: 'Lacoste', slug: 'lacoste' },
]

const PRODUCT_TYPES = [
  { name: 'Casual', slug: 'casual' },
  { name: 'Esportivo', slug: 'esportivo' },
  { name: 'Premium', slug: 'premium' },
]

// Pool: 8 unique picsum seeds per category slug → uploaded once, reused for all products in that cat
const CATEGORY_IMAGE_SEEDS: Record<string, string[]> = {
  camisetas: [
    'tshirt1',
    'tshirt2',
    'tshirt3',
    'tshirt4',
    'tshirt5',
    'tshirt6',
    'tshirt7',
    'tshirt8',
  ],
  calcas: ['pants1', 'pants2', 'pants3', 'pants4', 'pants5', 'pants6', 'pants7', 'pants8'],
  shorts: ['shorts1', 'shorts2', 'shorts3', 'shorts4', 'shorts5', 'shorts6', 'shorts7', 'shorts8'],
  moletons: [
    'hoodie1',
    'hoodie2',
    'hoodie3',
    'hoodie4',
    'hoodie5',
    'hoodie6',
    'hoodie7',
    'hoodie8',
  ],
  jaquetas: [
    'jacket1',
    'jacket2',
    'jacket3',
    'jacket4',
    'jacket5',
    'jacket6',
    'jacket7',
    'jacket8',
  ],
  tenis: [
    'sneaker1',
    'sneaker2',
    'sneaker3',
    'sneaker4',
    'sneaker5',
    'sneaker6',
    'sneaker7',
    'sneaker8',
  ],
  acessorios: [
    'accessory1',
    'accessory2',
    'accessory3',
    'accessory4',
    'accessory5',
    'accessory6',
    'accessory7',
    'accessory8',
  ],
  bermudas: [
    'bermuda1',
    'bermuda2',
    'bermuda3',
    'bermuda4',
    'bermuda5',
    'bermuda6',
    'bermuda7',
    'bermuda8',
  ],
}

function picsumUrl(seed: string) {
  return `https://picsum.photos/seed/${seed}/600/750`
}

const PRODUCT_DEFS: Array<{
  name: string
  desc: string
  catSlug: string
  brandSlug: string
  typeSlug: string
  price: number
  origPrice?: number
  isFeatured?: boolean
  numColors: number
  sizes: (typeof SIZES_ALL)[number][]
}> = [
  // ── Camisetas Nike ──────────────────────────────────────────────────────────
  {
    name: 'Camiseta Nike Dri-FIT Basic',
    desc: 'Camiseta leve com tecnologia Dri-FIT para máximo desempenho.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 129.9,
    origPrice: 159.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Nike Air Max Tee',
    desc: 'Camiseta com estampa Air Max, algodão premium.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 99.9,
    origPrice: 129.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Nike Just Do It',
    desc: 'O clássico Just Do It em algodão confortável.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 89.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Nike Pro Compression',
    desc: 'Compressão para treinos intensos.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 149.9,
    origPrice: 189.9,
    numColors: 2,
    sizes: ['P', 'M', 'G'],
  },
  {
    name: 'Camiseta Nike Sportswear Club',
    desc: 'Estilo casual com o DNA Nike.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 109.9,
    numColors: 5,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Nike Swoosh Graphic',
    desc: 'Estampa Swoosh oversized, tendência streetwear.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 119.9,
    origPrice: 149.9,
    numColors: 3,
    sizes: ['M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Nike ACG',
    desc: 'Linha All Conditions Gear, para aventuras ao ar livre.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 179.9,
    origPrice: 219.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Nike Training',
    desc: 'Desenvolvida para treinos com ventilação estratégica.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 139.9,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Nike Retro Logo',
    desc: 'Logotipo retro anos 90, algodão 100%.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 94.9,
    origPrice: 119.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G'],
  },
  {
    name: 'Camiseta Nike FC',
    desc: 'Linha futebol clube, poliéster reciclado.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 159.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  // ── Camisetas Adidas ────────────────────────────────────────────────────────
  {
    name: 'Camiseta Adidas Essentials 3S',
    desc: 'As 3 questões icônicas numa camiseta casual.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 119.9,
    origPrice: 149.9,
    isFeatured: true,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Adidas Run It',
    desc: 'Pronto para a corrida, Climalite.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 129.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Adidas Originals Trefoil',
    desc: 'O trevo Originals em algodão premium.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 109.9,
    origPrice: 139.9,
    numColors: 5,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Adidas Tiro 23',
    desc: 'Tecnologia AEROREADY para alta intensidade.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 139.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Puma Ess Logo',
    desc: 'Camiseta básica com logo bordado no peito.',
    catSlug: 'camisetas',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 89.9,
    origPrice: 109.9,
    numColors: 5,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Under Armour Tech 2.0',
    desc: 'Tecido de secagem ultra rápida HeatGear.',
    catSlug: 'camisetas',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 119.9,
    origPrice: 149.9,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta New Balance Athletics',
    desc: 'Algodão premium com estampa gráfica.',
    catSlug: 'camisetas',
    brandSlug: 'new-balance',
    typeSlug: 'casual',
    price: 99.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Lacoste Polo Sport',
    desc: 'Polo técnica com gola careca.',
    catSlug: 'camisetas',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 299.9,
    origPrice: 379.9,
    isFeatured: true,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Oakley B1B',
    desc: 'Tecnologia de compressão leve para treinos.',
    catSlug: 'camisetas',
    brandSlug: 'oakley',
    typeSlug: 'esportivo',
    price: 149.9,
    origPrice: 189.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Fila Graphic',
    desc: 'Estampa gráfica oversized estilo vintage.',
    catSlug: 'camisetas',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 79.9,
    origPrice: 99.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Nike Vapor',
    desc: 'Vapor knit para máxima agilidade.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 189.9,
    origPrice: 239.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Adidas Flamengo 24/25',
    desc: 'Camisa oficial Flamengo temporada 2024/25.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 299.9,
    origPrice: 359.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Camiseta Nike SB Skate',
    desc: 'Algodão pesado para o skate lifestyle.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 134.9,
    origPrice: 159.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Adidas Future Icons',
    desc: 'Sustentável, feita com materiais reciclados.',
    catSlug: 'camisetas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 129.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Camiseta Nike Dri-FIT Legend',
    desc: 'Leveza e tecnologia para alta performance.',
    catSlug: 'camisetas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 144.9,
    origPrice: 179.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  // ── Calças ──────────────────────────────────────────────────────────────────
  {
    name: 'Calça Nike Tech Fleece',
    desc: 'Moletom Tech Fleece ultramoderno e quente.',
    catSlug: 'calcas',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 399.9,
    origPrice: 479.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça Nike Jogger Club',
    desc: 'Calça jogger casual com ajuste no tornozelo.',
    catSlug: 'calcas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 199.9,
    origPrice: 249.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Calça Nike Dri-FIT Training',
    desc: 'Para treinos intensos, com bolsos laterais.',
    catSlug: 'calcas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 229.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça Nike Air',
    desc: 'Estética Nike Air em moletom pesado.',
    catSlug: 'calcas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 279.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça Adidas Tiro 23 Training',
    desc: 'Calça de treino com ajuste cônico.',
    catSlug: 'calcas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 219.9,
    origPrice: 269.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Calça Adidas Essentials Fleece',
    desc: 'Moletom essentials para o dia a dia.',
    catSlug: 'calcas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 189.9,
    origPrice: 229.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça Adidas Originals',
    desc: 'Corte slim com as três questões laterais.',
    catSlug: 'calcas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 239.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça Puma Essential',
    desc: 'Calça leve e versátil para treinos.',
    catSlug: 'calcas',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 169.9,
    origPrice: 209.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Calça Under Armour Rival Fleece',
    desc: 'Fleece pesado para dias mais frios.',
    catSlug: 'calcas',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 249.9,
    origPrice: 299.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Calça New Balance Essentials',
    desc: 'Calça atlética com bolsos funcionais.',
    catSlug: 'calcas',
    brandSlug: 'new-balance',
    typeSlug: 'casual',
    price: 199.9,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  // ── Shorts ──────────────────────────────────────────────────────────────────
  {
    name: 'Short Nike Dri-FIT Run',
    desc: 'Short de corrida com forro interno.',
    catSlug: 'shorts',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 119.9,
    origPrice: 149.9,
    isFeatured: true,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short Nike Sportswear',
    desc: 'Short casual Nike para o dia a dia.',
    catSlug: 'shorts',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 99.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Short Adidas 3 Stripes',
    desc: 'Short com as três questões icônicas.',
    catSlug: 'shorts',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 109.9,
    origPrice: 139.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short Puma Essential',
    desc: 'Short leve e versátil para treinos.',
    catSlug: 'shorts',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 89.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short Under Armour Launch',
    desc: 'HeatGear para corridas em dias quentes.',
    catSlug: 'shorts',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 139.9,
    origPrice: 169.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short New Balance Impact',
    desc: 'Desempenho para treinos de alto impacto.',
    catSlug: 'shorts',
    brandSlug: 'new-balance',
    typeSlug: 'esportivo',
    price: 129.9,
    numColors: 3,
    sizes: ['P', 'M', 'G'],
  },
  {
    name: 'Short Fila Training',
    desc: 'Confortável e estiloso para a academia.',
    catSlug: 'shorts',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 79.9,
    origPrice: 99.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Short Oakley Bark New',
    desc: 'Tecnologia de secagem rápida.',
    catSlug: 'shorts',
    brandSlug: 'oakley',
    typeSlug: 'premium',
    price: 169.9,
    origPrice: 209.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short Lacoste Sport',
    desc: 'Leveza premium para esportes de quadra.',
    catSlug: 'shorts',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 229.9,
    origPrice: 279.9,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Short Nike Club Fleece',
    desc: 'Short de moletom para dias mais frios.',
    catSlug: 'shorts',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 129.9,
    origPrice: 159.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  // ── Bermudas ────────────────────────────────────────────────────────────────
  {
    name: 'Bermuda Nike Club',
    desc: 'Bermuda de moletom com ajuste elástico.',
    catSlug: 'bermudas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 149.9,
    origPrice: 179.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Bermuda Adidas Essentials',
    desc: 'Bermuda casual com bolsos frontais e traseiros.',
    catSlug: 'bermudas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 139.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Bermuda Puma Active',
    desc: 'Bermuda esportiva com tecnologia Dry Cell.',
    catSlug: 'bermudas',
    brandSlug: 'puma',
    typeSlug: 'esportivo',
    price: 109.9,
    origPrice: 139.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Bermuda New Balance Athletics',
    desc: 'Corte moderno para treinos e passeios.',
    catSlug: 'bermudas',
    brandSlug: 'new-balance',
    typeSlug: 'casual',
    price: 129.9,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G'],
  },
  {
    name: 'Bermuda Under Armour Tech',
    desc: 'Material leve com proteção solar UPF 30.',
    catSlug: 'bermudas',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 159.9,
    origPrice: 199.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Bermuda Oakley Bark',
    desc: 'Premium com ajuste elástico e secagem rápida.',
    catSlug: 'bermudas',
    brandSlug: 'oakley',
    typeSlug: 'premium',
    price: 199.9,
    origPrice: 249.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Bermuda Fila Sport',
    desc: 'Bermuda estilo retro com bolso lateral.',
    catSlug: 'bermudas',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 99.9,
    origPrice: 129.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Bermuda Nike ACG Trail',
    desc: 'Para trilhas urbanas e aventuras ao ar livre.',
    catSlug: 'bermudas',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 219.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Bermuda Adidas Aeroready',
    desc: 'Controle de umidade para treinos intensos.',
    catSlug: 'bermudas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 149.9,
    origPrice: 179.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Bermuda Lacoste Live',
    desc: 'Bermuda lifestyle com logo crocodilo.',
    catSlug: 'bermudas',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 259.9,
    origPrice: 319.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  // ── Moletons ────────────────────────────────────────────────────────────────
  {
    name: 'Moletom Nike Tech Fleece',
    desc: 'O Tech Fleece que virou ícone streetwear global.',
    catSlug: 'moletons',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 449.9,
    origPrice: 549.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Moletom Nike Club Fleece',
    desc: 'Moletom com capuz em algodão macio.',
    catSlug: 'moletons',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 249.9,
    origPrice: 299.9,
    numColors: 5,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom Nike Essentials',
    desc: 'Básico e versátil para o inverno.',
    catSlug: 'moletons',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 199.9,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Moletom Adidas Originals',
    desc: 'O trevo Originals em moletom clássico.',
    catSlug: 'moletons',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 259.9,
    origPrice: 319.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom Adidas Entrada',
    desc: 'Ideal para o dia a dia.',
    catSlug: 'moletons',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 179.9,
    origPrice: 219.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Moletom Puma Ess Logo',
    desc: 'Moletom com logo bordado no peito.',
    catSlug: 'moletons',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 219.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom Under Armour Rival',
    desc: 'Fleece pesado para os dias mais frios.',
    catSlug: 'moletons',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 299.9,
    origPrice: 359.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom New Balance Athletics',
    desc: 'Moletom atlético com bolso canguru.',
    catSlug: 'moletons',
    brandSlug: 'new-balance',
    typeSlug: 'esportivo',
    price: 239.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Moletom Lacoste Logo',
    desc: 'O crocodilo em moletom premium.',
    catSlug: 'moletons',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 499.9,
    origPrice: 599.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom Fila Heritage',
    desc: 'Estilo retro com conforto moderno.',
    catSlug: 'moletons',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 189.9,
    origPrice: 239.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Moletom Oakley Ellipse',
    desc: 'Moletom com logo Ellipse bordado.',
    catSlug: 'moletons',
    brandSlug: 'oakley',
    typeSlug: 'casual',
    price: 299.9,
    origPrice: 369.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Moletom Fila Regatta',
    desc: 'Moletom careca estilo clean.',
    catSlug: 'moletons',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 179.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  // ── Jaquetas ────────────────────────────────────────────────────────────────
  {
    name: 'Jaqueta Nike Windrunner',
    desc: 'A icônica Windrunner, proteção contra o vento.',
    catSlug: 'jaquetas',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 599.9,
    origPrice: 749.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Nike Tech Pack',
    desc: 'Engenharia avançada com material resistente à água.',
    catSlug: 'jaquetas',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 799.9,
    origPrice: 999.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Nike Club',
    desc: 'Jaqueta varsity com fecho frontal e bolsos.',
    catSlug: 'jaquetas',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 349.9,
    origPrice: 429.9,
    numColors: 4,
    sizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Jaqueta Adidas Tiro',
    desc: 'Jaqueta de treino com bolsos com zíper.',
    catSlug: 'jaquetas',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 299.9,
    origPrice: 369.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Jaqueta Adidas Originals',
    desc: 'Estilo retro Originals com capuz.',
    catSlug: 'jaquetas',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 359.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Puma Essentials',
    desc: 'Jaqueta leve com forro polar.',
    catSlug: 'jaquetas',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 279.9,
    origPrice: 349.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Under Armour Storm',
    desc: 'Resistente à chuva com UA Storm.',
    catSlug: 'jaquetas',
    brandSlug: 'under-armour',
    typeSlug: 'esportivo',
    price: 499.9,
    origPrice: 629.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Jaqueta New Balance Puffer',
    desc: 'Puffer leve com enchimento sintético.',
    catSlug: 'jaquetas',
    brandSlug: 'new-balance',
    typeSlug: 'casual',
    price: 449.9,
    origPrice: 549.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Lacoste Bomber',
    desc: 'Bomber premium com logo bordado.',
    catSlug: 'jaquetas',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 799.9,
    origPrice: 999.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta Fila Retro',
    desc: 'Corta-vento estilo retro anos 90.',
    catSlug: 'jaquetas',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 259.9,
    origPrice: 319.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  {
    name: 'Jaqueta Oakley Divisional',
    desc: 'Jaqueta impermeável para atividades ao ar livre.',
    catSlug: 'jaquetas',
    brandSlug: 'oakley',
    typeSlug: 'premium',
    price: 699.9,
    origPrice: 849.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Jaqueta New Balance Athletics',
    desc: 'Jaqueta de treino em tecido woven leve.',
    catSlug: 'jaquetas',
    brandSlug: 'new-balance',
    typeSlug: 'esportivo',
    price: 349.9,
    origPrice: 429.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG', 'XGG'],
  },
  // ── Tênis ───────────────────────────────────────────────────────────────────
  {
    name: 'Tênis Nike Air Force 1',
    desc: 'O Air Force 1 original, ícone do sneaker culture.',
    catSlug: 'tenis',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 699.9,
    origPrice: 849.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Nike Air Max 90',
    desc: 'Unidade Air Max para conforto extremo.',
    catSlug: 'tenis',
    brandSlug: 'nike',
    typeSlug: 'premium',
    price: 799.9,
    origPrice: 999.9,
    isFeatured: true,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Nike Revolution 6',
    desc: 'Tênis de corrida com amortecimento React.',
    catSlug: 'tenis',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 329.9,
    origPrice: 399.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Nike Blazer Mid',
    desc: 'Silhueta clássica de basquete para o street.',
    catSlug: 'tenis',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 499.9,
    origPrice: 619.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Adidas Ultraboost 22',
    desc: 'Tecnologia Boost para corredores.',
    catSlug: 'tenis',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 899.9,
    origPrice: 1099.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Adidas Stan Smith',
    desc: 'O tênis mais icônico do mundo.',
    catSlug: 'tenis',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 549.9,
    origPrice: 699.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Adidas NMD R1',
    desc: 'Silhueta futurista com Boost.',
    catSlug: 'tenis',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 749.9,
    origPrice: 899.9,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Puma RS-X',
    desc: 'Silhueta chunky com Running System.',
    catSlug: 'tenis',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 429.9,
    origPrice: 529.9,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis New Balance 990v5',
    desc: 'Made in USA, o 990 é puro legado.',
    catSlug: 'tenis',
    brandSlug: 'new-balance',
    typeSlug: 'premium',
    price: 1099.9,
    origPrice: 1299.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis New Balance 574',
    desc: 'O clássico 574 em couro premium.',
    catSlug: 'tenis',
    brandSlug: 'new-balance',
    typeSlug: 'casual',
    price: 549.9,
    origPrice: 679.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Lacoste L005',
    desc: 'Luxo esportivo com solado chunky.',
    catSlug: 'tenis',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 899.9,
    origPrice: 1099.9,
    isFeatured: true,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Fila Disruptor 2',
    desc: 'O chunky que dominou as ruas.',
    catSlug: 'tenis',
    brandSlug: 'fila',
    typeSlug: 'casual',
    price: 359.9,
    origPrice: 449.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Oakley Flesh',
    desc: 'Estética futurista com amortecimento premium.',
    catSlug: 'tenis',
    brandSlug: 'oakley',
    typeSlug: 'premium',
    price: 649.9,
    origPrice: 799.9,
    numColors: 2,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Adidas Samba OG',
    desc: 'O Samba original, ícone do futebol das ruas.',
    catSlug: 'tenis',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 649.9,
    origPrice: 799.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Nike Pegasus 40',
    desc: 'React para corridas de longa distância.',
    catSlug: 'tenis',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 649.9,
    origPrice: 799.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Puma Suede Classic',
    desc: 'O Suede clássico em camurça premium.',
    catSlug: 'tenis',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 429.9,
    origPrice: 529.9,
    numColors: 4,
    sizes: ['P', 'M', 'G', 'GG'],
  },
  {
    name: 'Tênis Adidas Forum Low',
    desc: 'Silhueta retro basquete em couro sintético.',
    catSlug: 'tenis',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 499.9,
    origPrice: 619.9,
    numColors: 3,
    sizes: ['PP', 'P', 'M', 'G', 'GG'],
  },
  // ── Acessórios ──────────────────────────────────────────────────────────────
  {
    name: 'Boné Nike Dri-FIT',
    desc: 'Boné com tecnologia Dri-FIT e aba curva.',
    catSlug: 'acessorios',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 89.9,
    origPrice: 109.9,
    numColors: 4,
    sizes: ['M'],
  },
  {
    name: 'Boné Adidas Originals',
    desc: 'Boné snapback com trevo bordado.',
    catSlug: 'acessorios',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 99.9,
    origPrice: 129.9,
    numColors: 5,
    sizes: ['M'],
  },
  {
    name: 'Boné Puma Essentials',
    desc: 'Boné ajustável com logo metálico.',
    catSlug: 'acessorios',
    brandSlug: 'puma',
    typeSlug: 'casual',
    price: 79.9,
    numColors: 3,
    sizes: ['M'],
  },
  {
    name: 'Meia Nike Everyday',
    desc: 'Kit 3 pares meias cano médio.',
    catSlug: 'acessorios',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 59.9,
    origPrice: 79.9,
    numColors: 2,
    sizes: ['M'],
  },
  {
    name: 'Meia Adidas Performance',
    desc: 'Kit 3 pares meias esportivas.',
    catSlug: 'acessorios',
    brandSlug: 'adidas',
    typeSlug: 'esportivo',
    price: 64.9,
    numColors: 2,
    sizes: ['M'],
  },
  {
    name: 'Bolsa Nike Brasilia',
    desc: 'Mochila Nike 18L para treinos e academia.',
    catSlug: 'acessorios',
    brandSlug: 'nike',
    typeSlug: 'esportivo',
    price: 179.9,
    origPrice: 219.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['M'],
  },
  {
    name: 'Bolsa Adidas Classic',
    desc: 'Mochila Adidas com compartimento para laptop.',
    catSlug: 'acessorios',
    brandSlug: 'adidas',
    typeSlug: 'casual',
    price: 199.9,
    origPrice: 249.9,
    numColors: 2,
    sizes: ['M'],
  },
  {
    name: 'Pochete Nike Heritage',
    desc: 'Pochete com compartimento principal e frontal.',
    catSlug: 'acessorios',
    brandSlug: 'nike',
    typeSlug: 'casual',
    price: 129.9,
    numColors: 3,
    sizes: ['M'],
  },
  {
    name: 'Boné Oakley Tincan',
    desc: 'Boné snapback com logo metálico Oakley.',
    catSlug: 'acessorios',
    brandSlug: 'oakley',
    typeSlug: 'premium',
    price: 149.9,
    origPrice: 189.9,
    isFeatured: true,
    numColors: 3,
    sizes: ['M'],
  },
  {
    name: 'Boné Lacoste Classic',
    desc: 'Boné polo com logo crocodilo bordado.',
    catSlug: 'acessorios',
    brandSlug: 'lacoste',
    typeSlug: 'premium',
    price: 199.9,
    origPrice: 249.9,
    numColors: 3,
    sizes: ['M'],
  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pickN<T>(arr: T[], n: number): T[] {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n)
}

// Sequential EAN-13 compatible barcodes per color variant
const BARCODE_PREFIX = '7891234'
let barcodeCounter = 0
function nextSeedBarcode(): string {
  barcodeCounter++
  return `${BARCODE_PREFIX}${String(barcodeCounter).padStart(6, '0')}`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🧹 Limpando pedidos e produtos...')
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.variantSizeStock.deleteMany()
  await prisma.productVariant.deleteMany()
  await prisma.product.deleteMany()
  console.log('✅ Dados limpos.')

  // ── Categories / Brands / Types ───────────────────────────────────────────
  const catMap: Record<string, string> = {}
  for (const c of CATEGORIES) {
    const r = await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    catMap[c.slug] = r.id
  }
  const brandMap: Record<string, string> = {}
  for (const b of BRANDS) {
    const r = await prisma.brand.upsert({ where: { slug: b.slug }, update: {}, create: b })
    brandMap[b.slug] = r.id
  }
  const typeMap: Record<string, string> = {}
  for (const t of PRODUCT_TYPES) {
    const r = await prisma.productType.upsert({ where: { slug: t.slug }, update: {}, create: t })
    typeMap[t.slug] = r.id
  }

  // ── Pre-upload image pool to Cloudinary ───────────────────────────────────
  console.log('☁️  Fazendo upload do pool de imagens para o Cloudinary...')
  const imgPool: Record<string, string[]> = {}

  for (const [catSlug, seeds] of Object.entries(CATEGORY_IMAGE_SEEDS)) {
    const urls = seeds.map(picsumUrl)
    const uploaded = await uploadBatch(urls, 6)
    imgPool[catSlug] = uploaded
    console.log(`   ✓ ${catSlug}: ${uploaded.length} imagens`)
  }

  // ── Create 200 products ───────────────────────────────────────────────────
  console.log(`\n🛍️  Criando 200 produtos...`)
  let productCount = 0

  // Helper: pick N images from pool for a category
  function poolImages(catSlug: string, n: number): string[] {
    const pool = imgPool[catSlug] ?? imgPool['camisetas']
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, Math.min(n, pool.length))
  }

  for (let idx = 0; idx < 200; idx++) {
    const def = PRODUCT_DEFS[idx % PRODUCT_DEFS.length]
    const suffix =
      idx < PRODUCT_DEFS.length ? '' : ` - Ed. ${Math.floor(idx / PRODUCT_DEFS.length) + 1}`
    const slug = `${def.catSlug}-${def.brandSlug}-${idx}`
    const costPrice = +(def.price * 0.45).toFixed(2)
    const price =
      idx < PRODUCT_DEFS.length ? def.price : +(def.price * (0.9 + Math.random() * 0.2)).toFixed(2)

    const numColors = Math.min(def.numColors, COLORS.length)
    const colors = pickN(COLORS, numColors)

    const variantsData = colors.map((color) => {
      const images = poolImages(def.catSlug, rand(3, 5))
      const sizesData = def.sizes.map((size) => ({ size, stock: rand(5, 50) }))
      return {
        colorName: color.name,
        colorHex: color.hex,
        images,
        barcode: nextSeedBarcode(),
        sizes: { create: sizesData },
      }
    })

    const totalStock = variantsData.reduce(
      (acc, v) => acc + v.sizes.create.reduce((s, sz) => s + sz.stock, 0),
      0
    )
    const coverImages = variantsData[0]?.images ?? poolImages(def.catSlug, 3)

    await prisma.product.create({
      data: {
        name: `${def.name}${suffix}`,
        slug,
        description: def.desc,
        price,
        originalPrice: def.origPrice ?? null,
        images: coverImages,
        categoryId: catMap[def.catSlug],
        brandId: brandMap[def.brandSlug] ?? null,
        typeId: typeMap[def.typeSlug] ?? null,
        costPrice,
        marginPercent: 55,
        stock: totalStock,
        rating: +(Math.random() * 2 + 3).toFixed(1),
        reviewsCount: rand(0, 500),
        isActive: true,
        isFeatured: def.isFeatured ?? false,
        variants: { create: variantsData },
      },
    })

    productCount++
    if (productCount % 25 === 0) console.log(`   ${productCount}/200...`)
  }

  console.log(`\n✅ Concluído: ${productCount} produtos criados com imagens no Cloudinary.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
