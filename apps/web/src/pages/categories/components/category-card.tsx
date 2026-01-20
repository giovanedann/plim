import { CategoryIcon } from '@/components/category-icon'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { Category } from '@plim/shared'
import { Pencil, Trash2 } from 'lucide-react'

interface CategoryCardProps {
  category: Category
  isSystem: boolean
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
}

export function CategoryCard({ category, isSystem, onEdit, onDelete }: CategoryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <CategoryIcon name={category.icon} color={category.color} size="lg" animated />
          <p className="font-medium">{category.name}</p>
        </div>

        {!isSystem && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onEdit?.(category)}
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Editar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete?.(category)}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Excluir</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
