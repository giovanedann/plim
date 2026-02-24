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
import { isErrorResponse } from '@/lib/api-client'
import {
  type ExpenseChange,
  addExpensesToCache,
  applyOptimisticDashboardUpdate,
  applyOptimisticExpenseUpdate,
  rollbackDashboardUpdate,
  rollbackExpensesUpdate,
} from '@/lib/optimistic-updates'
import { queryKeys } from '@/lib/query-config'
import { expenseService } from '@/services/expense.service'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  EXPENSE_TYPES,
  INCOME_PAYMENT_METHODS,
  INCOME_TYPES,
  PAYMENT_METHODS,
  centsToDecimal,
  createExpenseSchema,
  decimalToCents,
  formatBRL,
  updateExpenseSchema,
} from '@plim/shared'
import type {
  Category,
  CreateExpense,
  CreditCard,
  EffectiveSpendingLimit,
  Expense,
  UpdateExpense,
} from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Info, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { QuickCategoryModal } from './quick-category-modal'

type TransactionMode = 'expense' | 'income'

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: Category[]
  creditCards: CreditCard[]
  selectedMonth: string
  expense?: Expense
  spendingLimit?: EffectiveSpendingLimit | null
  netCost?: number
  initialMode?: TransactionMode
}

const formSchema = z.object({
  type: z.enum([
    'one_time',
    'recurrent',
    'installment',
    'income',
    'income_recurrent',
    'income_installment',
  ]),
  description: z.string().min(1, 'Descrição é obrigatória').max(255),
  amount: z.string().min(1, 'Valor é obrigatório'),
  category_id: z.string().uuid('Selecione uma categoria').optional().or(z.literal('')),
  payment_method: z.enum(['credit_card', 'debit_card', 'pix', 'cash']).optional(),
  credit_card_id: z.string().uuid().optional().or(z.literal('')),
  date: z.string().min(1, 'Data é obrigatória'),
  recurrence_day: z.string().optional(),
  recurrence_start: z.string().optional(),
  recurrence_end: z.string().optional(),
  installment_total: z.string().optional(),
  installment_input_mode: z.enum(['total', 'per_installment']).optional(),
})

type FormData = z.infer<typeof formSchema>

function getDefaultDate(selectedMonth: string): string {
  const today = new Date()
  const [year, month] = selectedMonth.split('-').map(Number)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month

  if (isCurrentMonth) {
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  return `${selectedMonth}-01`
}

const CREATE_NEW_CATEGORY_VALUE = '__create_new__'
const NO_CREDIT_CARD_VALUE = '__none__'

export function ExpenseModal({
  open,
  onOpenChange,
  categories,
  creditCards,
  selectedMonth,
  expense,
  spendingLimit,
  netCost = 0,
  initialMode = 'expense',
}: ExpenseModalProps) {
  const isEditing = !!expense
  const queryClient = useQueryClient()
  const [showQuickCategoryModal, setShowQuickCategoryModal] = useState(false)
  const [transactionMode, setTransactionMode] = useState<TransactionMode>(initialMode)

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
      credit_card_id: '',
      date: getDefaultDate(selectedMonth),
      recurrence_day: '',
      recurrence_start: '',
      recurrence_end: '',
      installment_total: '',
      installment_input_mode: 'total',
    },
  })

  const expenseType = watch('type')
  const watchedAmount = watch('amount')
  const watchedPaymentMethod = watch('payment_method')
  const watchedInstallmentTotal = watch('installment_total')
  const watchedInstallmentInputMode = watch('installment_input_mode')

  const isIncomeMode = transactionMode === 'income'

  const handleTransactionModeChange = (mode: TransactionMode): void => {
    setTransactionMode(mode)
    const currentType = expenseType
    if (mode === 'income') {
      const typeMap: Record<string, FormData['type']> = {
        one_time: 'income',
        recurrent: 'income_recurrent',
        installment: 'income_installment',
      }
      setValue('type', typeMap[currentType] ?? 'income')
      setValue('category_id', '')
      setValue('payment_method', 'pix')
    } else {
      const typeMap: Record<string, FormData['type']> = {
        income: 'one_time',
        income_recurrent: 'recurrent',
        income_installment: 'installment',
      }
      setValue('type', typeMap[currentType] ?? 'one_time')
      setValue('payment_method', 'credit_card')
    }
  }

  const installmentCalculation = useMemo(() => {
    if (
      (expenseType !== 'installment' && expenseType !== 'income_installment') ||
      !watchedAmount ||
      !watchedInstallmentTotal
    ) {
      return null
    }

    const amountCents = decimalToCents(
      Number.parseFloat(watchedAmount.replace(/\./g, '').replace(',', '.'))
    )
    const installments = Number.parseInt(watchedInstallmentTotal, 10)

    if (Number.isNaN(amountCents) || Number.isNaN(installments) || installments < 2) {
      return null
    }

    const isPerInstallmentMode = watchedInstallmentInputMode === 'per_installment'

    if (isPerInstallmentMode) {
      const totalCents = amountCents * installments
      return {
        totalCents,
        perInstallmentCents: amountCents,
        formattedTotal: formatBRL(totalCents),
        formattedPerInstallment: formatBRL(amountCents),
        mode: 'per_installment' as const,
      }
    }

    const perInstallmentCents = Math.ceil(amountCents / installments)
    return {
      totalCents: amountCents,
      perInstallmentCents,
      formattedTotal: formatBRL(amountCents),
      formattedPerInstallment: formatBRL(perInstallmentCents),
      mode: 'total' as const,
    }
  }, [expenseType, watchedAmount, watchedInstallmentTotal, watchedInstallmentInputMode])

  const spendingLimitWarning = useMemo(() => {
    if (!spendingLimit || !watchedAmount || isIncomeMode) return null

    const amountCents = decimalToCents(
      Number.parseFloat(watchedAmount.replace(/\./g, '').replace(',', '.'))
    )

    if (Number.isNaN(amountCents) || amountCents <= 0) return null

    // For installments, use the total value (not per-installment)
    const effectiveAmount =
      expenseType === 'installment' && installmentCalculation
        ? installmentCalculation.totalCents
        : amountCents

    // For editing, subtract current expense amount to get accurate projection
    const currentExpenseAmount = expense?.amount_cents ?? 0
    const projectedTotal = netCost - currentExpenseAmount + effectiveAmount
    const percentage = Math.round((Math.max(0, projectedTotal) / spendingLimit.amount_cents) * 100)

    if (percentage < 75) return null

    if (percentage >= 100) {
      const exceededBy = projectedTotal - spendingLimit.amount_cents
      return {
        severity: 'exceeded' as const,
        message: `Esta despesa excederá seu limite em ${formatBRL(exceededBy)}`,
        percentage,
      }
    }

    if (percentage >= 90) {
      return {
        severity: 'high' as const,
        message: `Alerta: Com esta despesa você atingirá ${percentage}% do limite`,
        percentage,
      }
    }

    return {
      severity: 'medium' as const,
      message: `Atenção: Com esta despesa você atingirá ${percentage}% do limite`,
      percentage,
    }
  }, [
    watchedAmount,
    spendingLimit,
    netCost,
    expense,
    expenseType,
    installmentCalculation,
    isIncomeMode,
  ])

  useEffect(() => {
    if (open) {
      setTransactionMode(initialMode)
      if (expense) {
        const isIncome = expense.type === 'income'
        let type: FormData['type'] = 'one_time'
        if (isIncome) {
          if (expense.is_recurrent) {
            type = 'income_recurrent'
          } else if (expense.installment_total) {
            type = 'income_installment'
          } else {
            type = 'income'
          }
        } else if (expense.is_recurrent) {
          type = 'recurrent'
        } else if (expense.installment_total) {
          type = 'installment'
        }

        setTransactionMode(isIncome ? 'income' : 'expense')

        reset({
          type,
          description: expense.description,
          amount: centsToDecimal(expense.amount_cents).toFixed(2).replace('.', ','),
          category_id: expense.category_id ?? '',
          payment_method: expense.payment_method,
          credit_card_id: expense.credit_card_id ?? '',
          date: expense.date,
          recurrence_day: expense.recurrence_day?.toString() ?? '',
          recurrence_start: expense.recurrence_start ?? '',
          recurrence_end: expense.recurrence_end ?? '',
          installment_total: expense.installment_total?.toString() ?? '',
          installment_input_mode: 'total',
        })
      } else {
        const defaultDate = getDefaultDate(selectedMonth)
        const monthStart = `${selectedMonth}-01`
        const isIncome = initialMode === 'income'
        reset({
          type: isIncome ? 'income' : 'one_time',
          description: '',
          amount: '',
          category_id: '',
          payment_method: isIncome ? 'pix' : 'credit_card',
          credit_card_id: '',
          date: defaultDate,
          recurrence_day: defaultDate.split('-')[2] ?? '1',
          recurrence_start: monthStart,
          recurrence_end: '',
          installment_total: '',
          installment_input_mode: 'total',
        })
      }
    }
  }, [open, expense, selectedMonth, reset, initialMode])

  const createMutation = useMutation({
    mutationFn: (data: CreateExpense) => expenseService.createExpense(data),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })

      const categoryId =
        'category_id' in newExpense ? (newExpense as { category_id: string }).category_id : null
      const category = categoryId ? categories.find((c) => c.id === categoryId) : undefined
      const creditCardId =
        'credit_card_id' in newExpense
          ? (newExpense as { credit_card_id?: string }).credit_card_id
          : undefined
      const creditCard = creditCardId ? creditCards.find((c) => c.id === creditCardId) : undefined

      let date: string
      if (newExpense.type === 'recurrent' || newExpense.type === 'income_recurrent') {
        date = newExpense.recurrence_start
      } else {
        date = newExpense.date
      }

      const change: ExpenseChange = {
        amount_cents: newExpense.amount_cents,
        category_id: categoryId,
        category_name: category?.name,
        category_color: category?.color,
        category_icon: category?.icon,
        payment_method: newExpense.payment_method ?? 'pix',
        credit_card_id: creditCardId,
        credit_card_name: creditCard?.name,
        credit_card_color: creditCard?.color,
        credit_card_bank: creditCard?.bank,
        credit_card_flag: creditCard?.flag,
        date,
        installment_total:
          newExpense.type === 'installment' || newExpense.type === 'income_installment'
            ? newExpense.installment_total
            : undefined,
        operation: 'add',
      }

      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, change)
      return { previousDashboards }
    },
    onSuccess: (response, variables) => {
      if (!isErrorResponse(response) && 'data' in response && !('meta' in response)) {
        addExpensesToCache(queryClient, response.data)
      }
      const isIncome =
        variables.type === 'income' ||
        variables.type === 'income_recurrent' ||
        variables.type === 'income_installment'
      toast.success(isIncome ? 'Receita criada com sucesso!' : 'Despesa criada com sucesso!')
      onOpenChange(false)
    },
    onError: (error, variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      const isIncome =
        variables.type === 'income' ||
        variables.type === 'income_recurrent' ||
        variables.type === 'income_installment'
      toast.error(error.message || (isIncome ? 'Erro ao criar receita' : 'Erro ao criar despesa'))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpense }) =>
      expenseService.updateExpense(id, data),
    onMutate: async ({ id, data: updateData }) => {
      if (!expense) return {}

      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() })

      const oldCategory = categories.find((c) => c.id === expense.category_id)
      const newCategory = categories.find((c) => c.id === updateData.category_id)
      const oldCreditCard = creditCards.find((c) => c.id === expense.credit_card_id)
      const newCreditCard = creditCards.find((c) => c.id === updateData.credit_card_id)

      const removeChange: ExpenseChange = {
        amount_cents: expense.amount_cents,
        category_id: expense.category_id,
        category_name: oldCategory?.name,
        category_color: oldCategory?.color,
        category_icon: oldCategory?.icon,
        payment_method: expense.payment_method,
        credit_card_id: expense.credit_card_id,
        credit_card_name: oldCreditCard?.name,
        credit_card_color: oldCreditCard?.color,
        credit_card_bank: oldCreditCard?.bank,
        credit_card_flag: oldCreditCard?.flag,
        date: expense.date,
        operation: 'remove',
      }

      const addChange: ExpenseChange = {
        amount_cents: updateData.amount_cents ?? expense.amount_cents,
        category_id: updateData.category_id ?? expense.category_id,
        category_name: newCategory?.name ?? oldCategory?.name,
        category_color: newCategory?.color ?? oldCategory?.color,
        category_icon: newCategory?.icon ?? oldCategory?.icon,
        payment_method: updateData.payment_method ?? expense.payment_method,
        credit_card_id: updateData.credit_card_id ?? expense.credit_card_id ?? undefined,
        credit_card_name: newCreditCard?.name ?? oldCreditCard?.name,
        credit_card_color: newCreditCard?.color ?? oldCreditCard?.color,
        credit_card_bank: newCreditCard?.bank ?? oldCreditCard?.bank,
        credit_card_flag: newCreditCard?.flag ?? oldCreditCard?.flag,
        date: updateData.date ?? expense.date,
        operation: 'add',
      }

      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, removeChange)
      applyOptimisticDashboardUpdate(queryClient, addChange)

      const updatedExpense: Expense = {
        ...expense,
        amount_cents: updateData.amount_cents ?? expense.amount_cents,
        category_id: updateData.category_id ?? expense.category_id,
        payment_method: updateData.payment_method ?? expense.payment_method,
        credit_card_id:
          updateData.credit_card_id !== undefined
            ? updateData.credit_card_id
            : expense.credit_card_id,
        date: updateData.date ?? expense.date,
        description: updateData.description ?? expense.description,
      }
      const previousExpenses = applyOptimisticExpenseUpdate(queryClient, id, updatedExpense)

      return { previousDashboards, previousExpenses }
    },
    onSuccess: (response, { id }) => {
      if (!isErrorResponse(response) && 'data' in response && !('meta' in response)) {
        applyOptimisticExpenseUpdate(queryClient, id, response.data)
      }
      toast.success('Despesa atualizada com sucesso!')
      onOpenChange(false)
    },
    onError: (error, _variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      if (context?.previousExpenses) {
        rollbackExpensesUpdate(queryClient, context.previousExpenses)
      }
      toast.error(error.message || 'Erro ao atualizar despesa')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
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
        category_id: data.category_id || undefined,
        payment_method: data.payment_method,
        credit_card_id: data.credit_card_id || null,
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

    const creditCardId = data.credit_card_id || undefined
    const incomePaymentMethod =
      data.payment_method === 'pix' || data.payment_method === 'cash'
        ? data.payment_method
        : ('pix' as const)

    if (data.type === 'income') {
      createData = {
        type: 'income',
        description: data.description,
        amount_cents: amountCents,
        date: data.date,
        payment_method: incomePaymentMethod,
      }
    } else if (data.type === 'income_recurrent') {
      createData = {
        type: 'income_recurrent',
        description: data.description,
        amount_cents: amountCents,
        payment_method: incomePaymentMethod,
        recurrence_day: Number.parseInt(data.recurrence_day || '1', 10),
        recurrence_start: data.recurrence_start || data.date,
        recurrence_end: data.recurrence_end || undefined,
      }
    } else if (data.type === 'income_installment') {
      const installments = Number.parseInt(data.installment_total || '2', 10)
      const isPerInstallmentMode = data.installment_input_mode === 'per_installment'
      const totalAmountCents = isPerInstallmentMode ? amountCents * installments : amountCents

      createData = {
        type: 'income_installment',
        description: data.description,
        amount_cents: totalAmountCents,
        payment_method: incomePaymentMethod,
        date: data.date,
        installment_total: installments,
      }
    } else if (data.type === 'one_time') {
      if (!data.category_id || !data.payment_method) {
        toast.error('Dados inválidos. Verifique os campos.')
        return
      }
      createData = {
        type: 'one_time',
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        date: data.date,
        credit_card_id: creditCardId,
      }
    } else if (data.type === 'recurrent') {
      if (!data.category_id || !data.payment_method) {
        toast.error('Dados inválidos. Verifique os campos.')
        return
      }
      createData = {
        type: 'recurrent',
        description: data.description,
        amount_cents: amountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        recurrence_day: Number.parseInt(data.recurrence_day || '1', 10),
        recurrence_start: data.recurrence_start || data.date,
        recurrence_end: data.recurrence_end || undefined,
        credit_card_id: creditCardId,
      }
    } else {
      if (!data.category_id || !data.payment_method) {
        toast.error('Dados inválidos. Verifique os campos.')
        return
      }
      const installments = Number.parseInt(data.installment_total || '2', 10)
      const isPerInstallmentMode = data.installment_input_mode === 'per_installment'
      const totalAmountCents = isPerInstallmentMode ? amountCents * installments : amountCents

      createData = {
        type: 'installment',
        description: data.description,
        amount_cents: totalAmountCents,
        category_id: data.category_id,
        payment_method: data.payment_method,
        date: data.date,
        installment_total: installments,
        credit_card_id: creditCardId,
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
          <DialogTitle>
            {isEditing ? (isIncomeMode ? 'Editar Receita' : 'Editar Despesa') : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? isIncomeMode
                ? 'Edite os dados da receita abaixo.'
                : 'Edite os dados da despesa abaixo.'
              : 'Preencha os dados da nova transação.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                type="button"
                variant={transactionMode === 'expense' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => handleTransactionModeChange('expense')}
              >
                Despesa
              </Button>
              <Button
                type="button"
                variant={transactionMode === 'income' ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => handleTransactionModeChange('income')}
              >
                Receita
              </Button>
            </div>
          )}

          {!isEditing && (
            <div className="space-y-2">
              <Label>{isIncomeMode ? 'Tipo de Receita' : 'Tipo de Despesa'}</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {(isIncomeMode ? INCOME_TYPES : EXPENSE_TYPES).map((type) => (
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
              placeholder={isIncomeMode ? 'Ex: Salário, Freelance' : 'Ex: Almoço no restaurante'}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div
            className={`grid grid-cols-1 ${isIncomeMode ? '' : 'sm:grid-cols-2'} gap-3 sm:gap-4`}
          >
            <div className="space-y-2">
              <Label htmlFor="amount">
                {(expenseType === 'installment' || expenseType === 'income_installment') &&
                watchedInstallmentInputMode === 'per_installment'
                  ? 'Valor da parcela (R$)'
                  : 'Valor (R$)'}
              </Label>
              <Input id="amount" placeholder="0,00" {...register('amount')} />
              {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
            </div>

            {!isIncomeMode && (
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
                      <SelectContent className="max-h-[40vh] overflow-y-auto">
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
            )}
          </div>

          {spendingLimitWarning && (
            <div
              className={`flex items-center gap-2 rounded-lg border p-3 text-sm ${
                spendingLimitWarning.severity === 'exceeded'
                  ? 'border-red-500/50 bg-red-500/10 text-red-500'
                  : spendingLimitWarning.severity === 'high'
                    ? 'border-orange-500/50 bg-orange-500/10 text-orange-500'
                    : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{spendingLimitWarning.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-2">
              <Label>{isIncomeMode ? 'Forma de Recebimento' : 'Forma de Pagamento'}</Label>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={(value) => field.onChange(value || undefined)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {(isIncomeMode ? INCOME_PAYMENT_METHODS : PAYMENT_METHODS).map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {!isIncomeMode &&
              (watchedPaymentMethod === 'credit_card' || watchedPaymentMethod === 'debit_card') &&
              creditCards.length > 0 && (
                <div className="space-y-2">
                  <Label>Cartão</Label>
                  <Controller
                    name="credit_card_id"
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value || NO_CREDIT_CARD_VALUE}
                        onValueChange={(value) =>
                          field.onChange(value === NO_CREDIT_CARD_VALUE ? '' : value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NO_CREDIT_CARD_VALUE}>Nenhum</SelectItem>
                          {creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id}>
                              {card.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}

            {expenseType !== 'recurrent' && expenseType !== 'income_recurrent' && (
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

          {(expenseType === 'recurrent' || expenseType === 'income_recurrent') && !isEditing && (
            <div className="space-y-3 sm:space-y-4 rounded-lg border p-3 sm:p-4">
              <h4 className="font-medium">Configuração de Recorrência</h4>
              <div className="flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-400">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {isIncomeMode
                    ? 'Receitas recorrentes são criadas para os próximos 2 anos e renovadas automaticamente.'
                    : 'Despesas recorrentes são criadas para os próximos 2 anos e renovadas automaticamente.'}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3">
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

          {(expenseType === 'installment' || expenseType === 'income_installment') &&
            !isEditing && (
              <div className="space-y-3 sm:space-y-4 rounded-lg border p-3 sm:p-4">
                <h4 className="font-medium">Configuração de Parcelas</h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>O valor informado é:</Label>
                    <Controller
                      name="installment_input_mode"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={field.value === 'total' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => field.onChange('total')}
                          >
                            Valor total
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'per_installment' ? 'default' : 'outline'}
                            size="sm"
                            className="flex-1"
                            onClick={() => field.onChange('per_installment')}
                          >
                            Valor da parcela
                          </Button>
                        </div>
                      )}
                    />
                  </div>
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
                  </div>
                  {installmentCalculation && (
                    <div className="rounded-md bg-muted/50 p-3 space-y-1">
                      {installmentCalculation.mode === 'total' ? (
                        <>
                          <p className="text-xs text-muted-foreground">Valor de cada parcela:</p>
                          <p className="text-lg font-semibold text-primary">
                            {installmentCalculation.formattedPerInstallment}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">Valor total da compra:</p>
                          <p className="text-lg font-semibold text-primary">
                            {installmentCalculation.formattedTotal}
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Salvando...'
                : isEditing
                  ? 'Salvar'
                  : isIncomeMode
                    ? 'Criar Receita'
                    : 'Criar Despesa'}
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
