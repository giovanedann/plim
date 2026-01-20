import { z } from 'zod'

export const profileSchema = z.object({
  user_id: z.string().uuid(),
  name: z.string().nullable(),
  email: z.string().email(),
  avatar_url: z.string().url().nullable(),
  currency: z.string().default('BRL'),
  locale: z.string().default('pt-BR'),
  is_onboarded: z.boolean().default(false),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
})

export const updateProfileSchema = profileSchema
  .pick({
    name: true,
    avatar_url: true,
    currency: true,
    locale: true,
    is_onboarded: true,
  })
  .partial()

export type Profile = z.infer<typeof profileSchema>
export type UpdateProfile = z.infer<typeof updateProfileSchema>
