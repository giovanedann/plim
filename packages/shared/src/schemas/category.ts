import { z } from 'zod'

export const categorySchema = z.object({
  id: z.uuid(),
  user_id: z.uuid().nullable(),
  name: z.string().min(1).max(50),
  icon: z.string().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
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
