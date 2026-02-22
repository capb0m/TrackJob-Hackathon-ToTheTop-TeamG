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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="month" stroke="#7a8aaa" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="#7a8aaa" fontSize={12} />
          <Tooltip
            formatter={(value: number) => `${value}点`}
            contentStyle={{
              background: '#131929',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          />
          <Line type="monotone" dataKey="score" stroke="#6c8fff" strokeWidth={3} dot={{ fill: '#6c8fff' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
