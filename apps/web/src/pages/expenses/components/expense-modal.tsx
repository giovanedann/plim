import { CategoryIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { expenseService } from '@/services/expense.service'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  EXPENSE_TYPES,
  PAYMENT_METHODS,
  centsToDecimal,
  createExpenseSchema,
  decimalToCents,
  formatBRL,
  updateExpenseSchema,
} from '@plim/shared'
import type { Category, CreateExpense, Expense, ExpenseType, UpdateExpense } from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { QuickCategoryModal } from './quick-category-modal'

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  selectedMonth: string
  expense?: Expense
}

const formSchema = z.object({
  type: z.enum(['one_time', 'recurrent', 'installment']),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.string().min(1, 'Valor é obrigatório'),
  category_id: z.string().uuid('Selecione uma categoria'),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']),
  date: z.string().min(1, 'Data é obrigatória'),
  recurrence_day: z.string().optional(),
  recurrence_start: z.string().optional(),
  recurrence_end: z.string().optional(),
  installment_total: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

function getDefaultDate(selectedMonth: string): string {
  const today = new Date()
  const [year, month] = selectedMonth.split('-').map(Number)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  if (isCurrentMonth) {
    return today.toISOString().split('T')[0] as string
  }

  return `${selectedMonth}-01`
}

const CREATE_NEW_CATEGORY_VALUE = '__create_new__'

export function ExpenseModal({
  open,
  onOpenChange,
  categories,
  selectedMonth,
  expense,
}: ExpenseModalProps) {
  const isEditing = !!expense
  const queryClient = useQueryClient()
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'one_time',
      description: '',
      amount: '',
      category_id: '',
      payment_method: 'credit_card',
      date: getDefaultDate(selectedMonth),
      recurrence_day: '',
      recurrence_start: '',
      recurrence_end: '',
      installment_total: '',
    },
  })

  const expenseType = watch('type')
  const watchedAmount = watch('amount')
  const watchedInstallmentTotal = watch('installment_total')

  const installmentPreview = useMemo(() => {
    if (expenseType !== 'installment' || !watchedAmount || !watchedInstallmentTotal) {
      return null
    }

    const totalCents = decimalToCents(
      Number.parseFloat(watchedAmount.replace(/\./g, '').replace(',', '.'))
    )
    const installments = Number.parseInt(watchedInstallmentTotal, 10)

    if (Number.isNaN(totalCents) || Number.isNaN(installments) || installments < 2) {
      return null
    }

    const perInstallment = Math.ceil(totalCents / installments)
    return {
      perInstallment,
      formatted: formatBRL(perInstallment),
    }
  }, [expenseType, watchedAmount, watchedInstallmentTotal])

  useEffect(() => {
    if (open) {
      if (expense) {
        let type: ExpenseType = 'one_time'
        if (expense.is_recurrent) type = 'recurrent'
        else if (expense.installment_total) type = 'installment'

        reset({
          type,
          description: expense.description,
          amount: centsToDecimal(expense.amount_cents).toFixed(2).replace('.', ','),
          category_id: expense.category_id,
          payment_method: expense.payment_method,
          date: expense.date,
          recurrence_day: expense.recurrence_day?.toString() ?? '',
          recurrence_start: expense.recurrence_start ?? '',
          recurrence_end: expense.recurrence_end ?? '',
          installment_total: expense.installment_total?.toString() ?? '',
        })
      } else {
        const defaultDate = getDefaultDate(selectedMonth)
        const monthStart = `${selectedMonth}-01`
        reset({
          type: 'one_time',
          description: '',
          amount: '',
          category_id: '',
          payment_method: 'credit_card',
          date: defaultDate,
          recurrence_day: new Date(defaultDate).getDate().toString(),
          recurrence_start: monthStart,
          recurrence_end: '',
          installment_total: '',
        })
      }
    }
  }, [open, expense, selectedMonth, reset])

  const createMutation = useMutation({
    mutationFn: (data: CreateExpense) => expenseService.createExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      toast.success('Despesa criada com sucesso!')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar despesa')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpense }) =>
      expenseService.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      toast.success('Despesa atualizada com sucesso!')
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar despesa')
    },
  })

  const onSubmit = (data: FormData) => {
    const amountCents = decimalToCents(
      Number.parseFloat(data.amount.replace(/\./g, '').replace(',', '.'))
    )

    if (isEditing && expense) {
      const updateData: UpdateExpense = {
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        date: data.date,
      }

      const validated = updateExpenseSchema.safeParse(updateData)
      if (validated.success) {
        updateMutation.mutate({ id: expense.id, data: validated.data })
      } else {
        console.error('Update validation failed:', validated.error)
        toast.error('Dados inválidos. Verifique os campos.')
      }
      return
    }

    let createData: CreateExpense

    if (data.type === 'one_time') {
      createData = {
        type: 'one_time',
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        date: data.date,
      }
    } else if (data.type === 'recurrent') {
      createData = {
        type: 'recurrent',
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        recurrence_day: Number.parseInt(data.recurrence_day || '1', 10),
        recurrence_start: data.recurrence_start || data.date,
        recurrence_end: data.recurrence_end || undefined,
      }
    } else {
      createData = {
        type: 'installment',
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        date: data.date,
        installment_total: Number.parseInt(data.installment_total || '2', 10),
      }
    }

    const validated = createExpenseSchema.safeParse(createData)
    if (validated.success) {
      createMutation.mutate(validated.data)
    } else {
      console.error('Create validation failed:', validated.error)
      toast.error('Dados inválidos. Verifique os campos.')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Despesa' : 'Nova Despesa'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Edite os dados da despesa abaixo.' : 'Preencha os dados da nova despesa.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label>Tipo de Despesa</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex flex-col items-start">
                            <span>{type.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {type.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Almoço no restaurante"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" placeholder="0,00" {...register('amount')} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value === CREATE_NEW_CATEGORY_VALUE) {
                        setShowQuickCategoryModal(true)
                      } else {
                        field.onChange(value)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <CategoryIcon name={category.icon} color={category.color} size="sm" />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value={CREATE_NEW_CATEGORY_VALUE}>
                        <div className="flex items-center gap-2 text-primary">
                          <Plus className="h-3 w-3" />
                          Criar nova categoria
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id && (
                <p className="text-sm text-destructive">{errors.category_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {expenseType !== 'recurrent' && (
              <div className="space-y-2">
                <Label>Data</Label>
                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Selecione a data"
                    />
                  )}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>
            )}
          </div>

          {expenseType === 'recurrent' && !isEditing && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Configuração de Recorrência</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recurrence_day">Dia do mês</Label>
                  <Input
                    id="recurrence_day"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1-31"
                    {...register('recurrence_day')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Controller
                    name="recurrence_start"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Data início"
                      />
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fim (opcional)</Label>
                  <Controller
                    name="recurrence_end"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Data fim"
                      />
                    )}
                  />
                </div>
              </div>
            </div>
          )}

          {expenseType === 'installment' && !isEditing && (
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Configuração de Parcelas</h4>
              <div className="space-y-2">
                <Label htmlFor="installment_total">Número de parcelas</Label>
                <Input
                  id="installment_total"
                  type="number"
                  min={2}
                  max={48}
                  placeholder="2-48"
                  {...register('installment_total')}
                />
                <p className="text-xs text-muted-foreground">
                  O valor informado acima é o valor total da compra.
                </p>
                {installmentPreview && (
                  <p className="text-sm font-medium text-primary">
                    Cada parcela: {installmentPreview.formatted}
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Despesa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <QuickCategoryModal
        open={showQuickCategoryModal}
        onOpenChange={setShowQuickCategoryModal}
        onCategoryCreated={(category) => {
          setValue('category_id', category.id)
        }}
      />
    </Dialog>
  )
}
