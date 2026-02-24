import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { CreditCard } from '@plim/shared'
import { motion } from 'framer-motion'
import { CalendarClock, Edit, MoreVertical, Trash2 } from 'lucide-react'
import { CreditCard3D } from './credit-card-3d'

interface CreditCardListProps {
  creditCards: CreditCard[]
  onEdit: (card: CreditCard) => void
  onDelete: (card: CreditCard) => void
}

export function CreditCardList({ creditCards, onEdit, onDelete }: CreditCardListProps) {
  if (creditCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-labelledby="empty-card-title"
          >
            <title id="empty-card-title">Cartão de crédito</title>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <line x1="2" y1="10" x2="22" y2="10" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium">Nenhum cartão cadastrado</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Adicione seus cartões para organizar suas despesas.
        </p>
      </div>
    )
  }

  return (
    <div
      className="grid justify-center gap-4 sm:grid-cols-2 sm:justify-start xl:grid-cols-3"
      data-tutorial-id="credit-card-list"
    >
      {creditCards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="group relative inline-block p-3">
            <CreditCard3D
              name={card.name}
              color={card.color}
              flag={card.flag}
              bank={card.bank}
              last4Digits={card.last_4_digits}
              size="md"
            />

            {card.expiration_day && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                <span>Vence dia {card.expiration_day}</span>
              </div>
            )}

            {/* Actions dropdown - positioned on top right of card */}
            <div className="absolute right-1 top-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(card)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(card)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
