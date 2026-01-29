import { z } from 'zod'

export const deleteAccountSchema = z.object({
  password: z.union([z.string(), z.undefined()]).optional(),
})

export type DeleteAccount = z.infer<typeof deleteAccountSchema>
