import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Profile } from '@plim/shared'

const profileFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  currency: z.string(),
  locale: z.string(),
})

type ProfileFormData = z.infer<typeof profileFormSchema>

const CURRENCIES = [
  { value: 'BRL', label: 'Real (BRL)' },
  { value: 'USD', label: 'Dólar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
]

const LOCALES = [
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'en-US', label: 'English (US)' },
]

interface ProfileFormProps {
  profile: Profile
  onSubmit: (data: ProfileFormData) => void
  onCancel: () => void
  isSubmitting: boolean
}

export function ProfileForm({ profile, onSubmit, onCancel, isSubmitting }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile.name ?? '',
      currency: profile.currency,
      locale: profile.locale,
    },
  })

  useEffect(() => {
    reset({
      name: profile.name ?? '',
      currency: profile.currency,
      locale: profile.locale,
    })
  }, [profile, reset])

  const currency = watch('currency')
  const locale = watch('locale')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register('name')} placeholder="Seu nome" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" value={profile.email} disabled className="bg-muted" />
        <p className="text-sm text-muted-foreground">O email não pode ser alterado</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Moeda</Label>
        <Select value={currency} onValueChange={(value) => setValue('currency', value)}>
          <SelectTrigger id="currency">
            <SelectValue placeholder="Selecione a moeda" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locale">Idioma</Label>
        <Select value={locale} onValueChange={(value) => setValue('locale', value)}>
          <SelectTrigger id="locale">
            <SelectValue placeholder="Selecione o idioma" />
          </SelectTrigger>
          <SelectContent>
            {LOCALES.map((l) => (
              <SelectItem key={l.value} value={l.value}>
                {l.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
