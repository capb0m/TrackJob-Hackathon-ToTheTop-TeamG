import type { AdviceHistoryItem, AdviceLog } from '@lifebalance/shared/types'

export const adviceMock: AdviceLog = {
  id: 'advice-2025-06',
  month: '2025-06',
  score: 72,
  generated_at: '2025-06-29T12:00:00Z',
  content: {
    urgent: [
      {
        title: '食費が予算の92%に達しています',
        body: '残り7日で¥2,800の余裕しかありません。コンビニ利用を減らし自炊を増やしましょう。',
      },
      {
        title: '交際費が前月比で30%増えています',
        body: '月末の会食が集中しています。次月は予算枠を先に確保しましょう。',
      },
    ],
    suggestions: [
      {
        title: '使っていないサブスクを停止',
        body: '動画系1件を停止すると年間で約1.8万円を削減できます。',
      },
      {
        title: '週1回の作り置きで食費を平準化',
        body: '変動費のブレを抑えて、月次目標の達成率が安定します。',
      },
    ],
    positives: [
      {
        title: '6ヶ月連続で貯蓄目標の90%以上',
        body: '良い習慣が定着しています。固定費最適化でさらに伸ばせます。',
      },
      {
        title: '住居費を予算内で維持',
        body: '大きな固定費を抑えられている点は強みです。',
      },
    ],
    next_month_goals: ['食費を¥27,000以内に抑える', '育児積立を¥23,000に増額する', 'サブスクを1つ停止する'],
  },
}

export const scoreHistory: AdviceHistoryItem[] = [
  { month: '2025-01', score: 65 },
  { month: '2025-02', score: 68 },
  { month: '2025-03', score: 67 },
  { month: '2025-04', score: 70 },
  { month: '2025-05', score: 67 },
  { month: '2025-06', score: 72 },
]
