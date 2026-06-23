import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  price: z.coerce.number().positive('Preço deve ser positivo'),
  originalPrice: z.coerce
    .number()
    .positive('Preço original deve ser positivo')
    .optional()
    .nullable(),
  costPrice: z.coerce.number().positive('Custo deve ser positivo').optional().nullable(),
  marginPercent: z.coerce.number().min(0).max(9999).optional().nullable(),
  brandId: z.string().optional().nullable(),
  typeId: z.string().optional().nullable(),
  supplierId: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  stock: z.coerce.number().int().min(0, 'Estoque não pode ser negativo'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  images: z.array(z.string().min(1, 'Imagem inválida')).min(1, 'Adicione pelo menos uma imagem'),
})

export type ProductInput = z.infer<typeof productSchema>
