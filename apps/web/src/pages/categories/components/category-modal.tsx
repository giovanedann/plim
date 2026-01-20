import { ColorPicker, PRESET_COLORS } from '@/components/color-picker'
import { IconPicker } from '@/components/icon-picker'
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
import type { Category, CreateCategory } from '@myfinances/shared'
import { useEffect, useState } from 'react'

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

  const [name, setName] = useState('')
  const [icon, setIcon] = useState<CategoryIconName | null>(null)
  const [color, setColor] = useState<string | null>(PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      if (category) {
        setName(category.name)
        setIcon((category.icon as CategoryIconName) ?? null)
        setColor(category.color)
      } else {
        setName('')
        setIcon(null)
        setColor(PRESET_COLORS[0])
      }
      setError(null)
    }
  }, [open, category])

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (name.trim().length > 50) {
      setError('Nome deve ter no máximo 50 caracteres')
      return
    }

    try {
      await onSubmit({
        name: name.trim(),
        icon: icon,
        color: color,
      })
      handleClose()
    } catch {
      setError('Erro ao salvar categoria. Tente novamente.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite os dados da categoria abaixo.'
              : 'Crie uma nova categoria para organizar suas despesas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              placeholder="Ex: Streaming"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Ícone</Label>
            <IconPicker value={icon} onChange={setIcon} color={color ?? '#6b7280'} />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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
