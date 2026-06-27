import { NextRequest } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'
import { ok, badRequest, internalError } from '@/lib/api-response'
import { requireAdmin } from '@/lib/auth-guard'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
// Base64 is ~33% larger than binary — 10MB binary ≈ 13.4MB base64
const MAX_BASE64_LENGTH = Math.ceil(MAX_SIZE_BYTES * (4 / 3)) + 100

const SAFE_FOLDER = 'brothers-outlet/products'

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin()
    if (error) return error

    const { dataUrl } = await req.json()

    if (!dataUrl || typeof dataUrl !== 'string') return badRequest('dataUrl obrigatório')

    // Reject anything that isn't a data URI (blocks SSRF via remote URLs)
    if (!ALLOWED_TYPES.some((t) => dataUrl.startsWith(t))) {
      return badRequest('Apenas imagens JPEG, PNG ou WebP são permitidas')
    }

    // Enforce size limit before sending to Cloudinary
    if (dataUrl.length > MAX_BASE64_LENGTH) {
      return badRequest('Imagem muito grande. Limite: 10MB')
    }

    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: SAFE_FOLDER,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    })

    return ok({ url: result.secure_url })
  } catch (e) {
    return internalError(e)
  }
}
