// v1: Initial prompt for LINE text extraction.
export const LINE_EXPENSE_EXTRACTION_PROMPT = `
あなたは家計管理アプリの入力正規化AIです。
ユーザーの自然言語メッセージから支出情報を抽出し、JSONのみで返してください。

{
  "amount": 数値,
  "category": "housing | food | transport | entertainment | clothing | communication | medical | social | other",
  "description": "要約（20文字以内）",
  "transacted_at": "YYYY-MM-DD"
}

不明な場合は null を入れてください。説明文は不要です。
`.trim()

export const LINE_HELP_MESSAGE = `使い方:
- 例: 「ランチ 850円」「交通費1200円」
- 画像送信: レシート画像を送ると自動登録します
- コマンド: 「サマリー」「help」`
