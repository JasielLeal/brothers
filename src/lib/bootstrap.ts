import bcrypt from 'bcryptjs'
import { prisma } from './db'

const MIN_PASSWORD_LENGTH = 12

export async function bootstrapAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env

  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return
  }

  if (ADMIN_PASSWORD.length < MIN_PASSWORD_LENGTH) {
    console.error(
      `[bootstrap] ADMIN_PASSWORD muito curta (mínimo ${MIN_PASSWORD_LENGTH} caracteres). Administrador não criado.`
    )
    return
  }

  try {
    const count = await prisma.user.count()
    if (count > 0) return

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'ADMIN',
      },
    })

    console.log(`[bootstrap] Administrador criado: ${ADMIN_EMAIL}`)
  } catch (error) {
    console.error(
      '[bootstrap] Falha ao criar administrador:',
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as Error).message
        : 'Erro desconhecido'
    )
  }
}
