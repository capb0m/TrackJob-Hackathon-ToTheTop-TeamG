'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@lifebalance/shared/types'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useCreateTransaction } from '@/hooks/useTransactions'
import { useToast } from '@/hooks/useToast'
import { ocrApi, transactionsApi } from '@/lib/api'

const formSchema = z.object({
  amount: z.number({ invalid_type_error: '金額を入力してください' }).min(1, '1円以上を入力してください'),
  category: z.enum(EXPENSE_CATEGORIES, {
    required_error: 'カテゴリを選択してください',
  }),
  description: z.string().max(200, 'メモは200文字以内で入力してください').optional().default(''),
  transactedAt: z.string().min(1, '日付を選択してください'),
})

type FormValues = z.infer<typeof formSchema>

interface AddExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory)
}

export function AddExpenseModal({ open, onOpenChange }: AddExpenseModalProps) {
  const [ocrState, setOcrState] = useState<string>('')
  const [ocrLoading, setOcrLoading] = useState(false)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const createTransaction = useCreateTransaction()
  const { toast } = useToast()

  const categories = [
    { value: 'housing', label: '住居費', icon: '🏠' },
    { value: 'food', label: '食費', icon: '🍜' },
    { value: 'transport', label: '交通費', icon: '🚃' },
    { value: 'entertainment', label: '娯楽', icon: '🎮' },
    { value: 'clothing', label: '衣類', icon: '👕' },
    { value: 'communication', label: '通信', icon: '📱' },
    { value: 'medical', label: '医療', icon: '🏥' },
    { value: 'social', label: '交際費', icon: '🍺' },
    { value: 'other', label: 'その他', icon: '📦' },
  ] as const

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: undefined,
      category: 'food',
      description: '',
      transactedAt: new Date().toISOString().slice(0, 10),
    },
  })

  const onSubmit = async (values: FormValues) => {
    await createTransaction.mutateAsync({
      amount: values.amount,
      type: 'expense',
      category: values.category,
      description: values.description,
      transacted_at: values.transactedAt,
      receipt_url: receiptUrl,
    })

    toast({ title: '支出を追加しました。', variant: 'success' })
    setReceiptUrl(null)
    setOcrState('')
    reset({
      amount: undefined,
      category: 'food',
      description: '',
      transactedAt: new Date().toISOString().slice(0, 10),
    })
    onOpenChange(false)
  }

  const selectedCategory = watch('category')

  async function runOcr(file: File) {
    setOcrLoading(true)
    setOcrState('画像をアップロードしています...')

    try {
      const uploaded = await transactionsApi.uploadReceipt(file)
      setReceiptUrl(uploaded.url)
      setOcrState('OCRで解析しています...')

      const parsed = await ocrApi.parse({ image_url: uploaded.url })

      if (parsed.amount !== null) {
        setValue('amount', parsed.amount, { shouldValidate: true })
      }
      if (parsed.category && isExpenseCategory(parsed.category)) {
        setValue('category', parsed.category, { shouldValidate: true })
      }
      if (parsed.description) {
        setValue('description', parsed.description, { shouldValidate: true })
      }
      if (parsed.transacted_at) {
        setValue('transactedAt', parsed.transacted_at, { shouldValidate: true })
      }

      if (parsed.confidence <= 0 || parsed.error_message) {
        setOcrState(parsed.error_message ?? 'OCRの確信度が低いため、内容を確認してください。')
        return
      }

      setOcrState(`OCR結果を反映しました（確信度 ${Math.round(parsed.confidence * 100)}%）`)
    } catch (error) {
      setOcrState(
        error instanceof Error
          ? `OCR処理に失敗しました: ${error.message}`
          : 'OCR処理に失敗しました。手動で入力してください。',
      )
    } finally {
      setOcrLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>支出を追加</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form id="add-expense-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <label className="text-xs text-text2" htmlFor="amount">
                金額
              </label>
              <Input id="amount" type="number" {...register('amount', { valueAsNumber: true })} />
              {errors.amount ? <p className="text-xs text-red-300">{errors.amount.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text2">カテゴリ</label>
              <input type="hidden" {...register('category')} />
              <div className="grid grid-cols-4 gap-2">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    className={`rounded-lg border px-2 py-2 text-xs transition-colors ${
                      selectedCategory === category.value
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-white/10 bg-bg text-text2 hover:border-accent/40 hover:text-text'
                    }`}
                    onClick={() => setValue('category', category.value, { shouldValidate: true })}
                    aria-label={category.label}
                  >
                    <span className="block text-base">{category.icon}</span>
                    {category.label}
                  </button>
                ))}
              </div>
              {errors.category ? <p className="text-xs text-red-300">{errors.category.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text2" htmlFor="description">
                メモ
              </label>
              <Input id="description" {...register('description')} />
              {errors.description ? <p className="text-xs text-red-300">{errors.description.message}</p> : null}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-text2" htmlFor="transactedAt">
                日付
              </label>
              <Input id="transactedAt" type="date" {...register('transactedAt')} />
              {errors.transactedAt ? <p className="text-xs text-red-300">{errors.transactedAt.message}</p> : null}
            </div>

            <div className="space-y-2 rounded-lg border border-dashed border-white/20 bg-bg p-3">
              <label className="text-xs text-text2" htmlFor="receipt-upload">
                レシート画像（OCR）
              </label>
              <Input
                id="receipt-upload"
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (!file) return
                  void runOcr(file)
                }}
                disabled={ocrLoading}
              />
              {ocrState ? <p className="text-xs text-accent2">{ocrState}</p> : null}
            </div>
          </form>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={createTransaction.isPending}>
            キャンセル
          </Button>
          <Button form="add-expense-form" type="submit" disabled={createTransaction.isPending}>
            {createTransaction.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
