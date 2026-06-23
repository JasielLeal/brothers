import { config } from 'dotenv'
config()

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const prisma = createClient()

async function seedAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error(
      'Erro: defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD no arquivo .env antes de executar o seed.'
    )
    process.exit(1)
  }

  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } })

  if (existing) {
    console.log(`Administrador já existe: ${ADMIN_EMAIL}`)
    return
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)

  const user = await prisma.user.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
    },
  })

  console.log(`Administrador criado com sucesso: ${user.email} (id: ${user.id})`)
}

seedAdmin()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
