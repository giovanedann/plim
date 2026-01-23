import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORY_ICONS, CATEGORY_ICON_GROUPS, type CategoryIconName } from '@/lib/icons'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface IconPickerProps {
  value: CategoryIconName | null
  onChange: (icon: CategoryIconName) => void
  color?: string
}

export function IconPicker({
  value,
  onChange,
  color = 'hsl(var(--muted-foreground))',
}: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const SelectedIcon = value ? CATEGORY_ICONS[value] : null

  const filteredGroups = Object.entries(CATEGORY_ICON_GROUPS).reduce(
    (acc, [groupName, icons]) => {
      const filtered = icons.filter((iconName) =>
        iconName.toLowerCase().includes(search.toLowerCase())
      )
      if (filtered.length > 0) {
        acc[groupName] = filtered
      }
      return acc
    },
    {} as Record<string, readonly CategoryIconName[]>
  )

  const handleSelect = (iconName: CategoryIconName) => {
    onChange(iconName)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {SelectedIcon ? (
            <>
              <SelectedIcon className="h-4 w-4" style={{ color }} />
              <span className="truncate">{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Selecione um ícone</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-80 max-w-80 p-0" align="start">
        <div className="p-3 border-b">
          <Input
            placeholder="Buscar ícone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div
          className="h-64 overflow-y-auto overscroll-contain touch-auto"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="p-3 space-y-4">
            {Object.entries(filteredGroups).map(([groupName, icons]) => (
              <div key={groupName}>
                <Label className="text-xs text-muted-foreground mb-2 block">{groupName}</Label>
                <div className="grid grid-cols-6 gap-1">
                  {icons.map((iconName) => {
                    const Icon = CATEGORY_ICONS[iconName]
                    const isSelected = value === iconName
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => handleSelect(iconName)}
                        className={cn(
                          'flex items-center justify-center h-9 w-9 rounded-md transition-colors',
                          'hover:bg-accent hover:text-accent-foreground',
                          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                          isSelected && 'bg-primary text-primary-foreground'
                        )}
                        title={iconName}
                      >
                        <Icon
                          className="h-4 w-4"
                          style={{ color: isSelected ? undefined : color }}
                        />
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
            {Object.keys(filteredGroups).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum ícone encontrado
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
