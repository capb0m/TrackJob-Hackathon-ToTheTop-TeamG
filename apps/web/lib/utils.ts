import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumberInput(value: number | undefined) {
  if (value === undefined || Number.isNaN(value)) {
    return ''
  }

  return new Intl.NumberFormat('ja-JP', {
    maximumFractionDigits: 0,
  }).format(value)
}

export function parseNumberInput(raw: string) {
  const normalized = raw.replace(/[^\d]/g, '')
  if (!normalized) {
    return undefined
  }

  return Number(normalized)
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`
}

export function getCurrentYearMonth() {
  return new Date().toISOString().slice(0, 7)
}
