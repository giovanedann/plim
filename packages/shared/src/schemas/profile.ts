import { z } from 'zod'

export const profileSchema = z.object({
  user_id: z.uuid(),
  name: z.string().nullable(),
  email: z.email('Email inválido'),
  avatar_url: z.url('URL inválida').nullable(),
  currency: z.string().default('BRL'),
  locale: z.string().default('pt-BR'),
  is_onboarded: z.boolean().default(false),
  created_at: z.iso.datetime(),
  updated_at: z.iso.datetime(),
})

export const updateProfileSchema = z.object({
  name: z.string().nullable().optional(),
  avatar_url: z.url('URL inválida').nullable().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  is_onboarded: z.boolean().optional(),
})

export type Profile = z.infer<typeof profileSchema>
export type UpdateProfile = z.infer<typeof updateProfileSchema>

export const avatarUploadResponseSchema = z.object({
  avatar_url: z.url(),
})
export type AvatarUploadResponse = z.infer<typeof avatarUploadResponseSchema>
