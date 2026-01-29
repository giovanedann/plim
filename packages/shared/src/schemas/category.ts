import { z } from 'zod'

export const categorySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid().nullable(),
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  icon: z.string().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#000000)')
    .nullable(),
  is_active: z.boolean().default(true),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const createCategorySchema = categorySchema.pick({
  name: true,
  icon: true,
  color: true,
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type Category = z.infer<typeof categorySchema>
export type CreateCategory = z.infer<typeof createCategorySchema>
export type UpdateCategory = z.infer<typeof updateCategorySchema>
