'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface ScorePoint {
  month: string
  score: number
}

interface ScoreHistoryChartProps {
  data: ScorePoint[]
}

export function ScoreHistoryChart({ data }: ScoreHistoryChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,74,122,0.12)" />
          <XAxis dataKey="month" stroke="#6b857b" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="#6b857b" fontSize={12} />
          <Tooltip
            formatter={(value: number) => `${value}点`}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(47,74,122,0.12)',
              borderRadius: 12,
              boxShadow: '0 10px 24px rgba(35,55,95,0.08)',
            }}
          />
          <Line type="monotone" dataKey="score" stroke="#2fbf8f" strokeWidth={3} dot={{ fill: '#2fbf8f' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
