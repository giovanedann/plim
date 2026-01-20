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
import { categoryService } from '@/services/category.service'
import type { Category } from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

interface QuickCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (category: Category) => void
}

export function QuickCategoryModal({
  open,
  onOpenChange,
  onCategoryCreated,
}: QuickCategoryModalProps) {
  const [name, setName] = useState('')
  const [icon, setIcon] = useState<CategoryIconName | null>(null)
  const [color, setColor] = useState<string | null>(PRESET_COLORS[0])
  const [error, setError] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: categoryService.createCategory,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      if (response.data) {
        onCategoryCreated(response.data)
      }
      toast.success('Categoria criada com sucesso!')
      handleClose()
    },
    onError: (error) => {
      const errorMsg = error.message || 'Erro ao criar categoria. Tente novamente.'
      setError(errorMsg)
      toast.error(errorMsg)
    },
  })

  const handleClose = () => {
    setName('')
    setIcon(null)
    setColor(PRESET_COLORS[0])
    setError(null)
    onOpenChange(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
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

    createMutation.mutate({
      name: name.trim(),
      icon: icon,
      color: color,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Nova Categoria</DialogTitle>
          <DialogDescription>
            Crie uma nova categoria para organizar suas despesas.
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
            <IconPicker value={icon} onChange={setIcon} color={color ?? undefined} />
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Criando...' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
