import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'
import { useState } from 'react'

/**
 * Preset colors for category selection.
 * Carefully chosen for good contrast and visual distinction.
 */
export const PRESET_COLORS = [
  '#22c55e', // green-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ef4444', // red-500
  '#f59e0b', // amber-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#6b7280', // gray-500
  '#14b8a6', // teal-500
  '#f97316', // orange-500
  '#a855f7', // purple-500
  '#64748b', // slate-500
] as const

interface ColorPickerProps {
  value: string | null
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (color: string) => {
    onChange(color)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2">
          {value ? (
            <>
              <div className="h-4 w-4 rounded-full border" style={{ backgroundColor: value }} />
              <span>{value}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Selecione uma cor</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <Label className="text-xs text-muted-foreground mb-3 block">Cores disponíveis</Label>
        <div className="grid grid-cols-6 gap-2">
          {PRESET_COLORS.map((color) => {
            const isSelected = value === color
            return (
              <button
                key={color}
                type="button"
                onClick={() => handleSelect(color)}
                className={cn(
                  'relative flex items-center justify-center h-8 w-8 rounded-full transition-transform',
                  'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  isSelected && 'ring-2 ring-ring ring-offset-2'
                )}
                style={{ backgroundColor: color }}
                title={color}
              >
                {isSelected && <Check className="h-4 w-4 text-white drop-shadow-md" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
