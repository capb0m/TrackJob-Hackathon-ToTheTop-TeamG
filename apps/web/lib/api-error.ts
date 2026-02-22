import { ApiError } from '@/lib/api'

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) {
    return fallback
  }

  switch (error.code) {
    case 'VALIDATION_ERROR':
      return '入力内容を確認してください。'
    case 'UNAUTHORIZED':
      return 'ログインが必要です。再ログインしてください。'
    case 'FORBIDDEN':
      return 'この操作を実行する権限がありません。'
    case 'NOT_FOUND':
      return '対象データが見つかりません。'
    case 'CONFLICT':
      return 'データ競合が発生しました。画面を更新して再試行してください。'
    default:
      return fallback
  }
}
