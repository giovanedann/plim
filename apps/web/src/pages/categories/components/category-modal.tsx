import { ColorPicker, PRESET_COLORS } from '@/components/color-picker'
import { IconPicker } from '@/components/icons'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CategoryIconName } from '@/lib/icons'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Category, CreateCategory } from '@plim/shared'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  icon: z.string().nullable(),
  color: z.string().nullable(),
})

type FormData = z.infer<typeof formSchema>

interface CategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  onSubmit: (data: CreateCategory) => Promise<void>
  isPending: boolean
}

export function CategoryModal({
  open,
  onOpenChange,
  category,
  onSubmit,
  isPending,
}: CategoryModalProps) {
  const isEditing = !!category

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: category?.name ?? '',
      icon: (category?.icon as CategoryIconName) ?? null,
      color: category?.color ?? PRESET_COLORS[0],
    },
  })

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleFormSubmit = async (data: FormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        icon: data.icon,
        color: data.color,
      })
      handleClose()
    } catch {
      form.setError('root', { message: 'Erro ao salvar categoria. Tente novamente.' })
    }
  }

  const watchedColor = form.watch('color')

  return (
    <Dialog open={open} onOpenChange={handleClose} key={open ? (category?.id ?? 'new') : 'closed'}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite os dados da categoria abaixo.'
              : 'Crie uma nova categoria para organizar suas despesas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-3 sm:space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              placeholder="Ex: Streaming"
              {...form.register('name')}
              autoFocus
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <Controller
              name="icon"
              control={form.control}
              render={({ field }) => (
                <IconPicker
                  value={field.value as CategoryIconName | null}
                  onChange={field.onChange}
                  color={watchedColor ?? '#6b7280'}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <Controller
              name="color"
              control={form.control}
              render={({ field }) => <ColorPicker value={field.value} onChange={field.onChange} />}
            />
          </div>

          {form.formState.errors.root && (
            <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
