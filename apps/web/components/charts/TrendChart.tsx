'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface TrendPoint {
  label: string
  expense: number
  saving: number
  budget?: number
}

interface TrendChartProps {
  data: TrendPoint[]
}

export function TrendChart({ data }: TrendChartProps) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="label" stroke="#7a8aaa" fontSize={12} />
          <YAxis stroke="#7a8aaa" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: '#131929',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="expense" stroke="#4af0b0" strokeWidth={2} dot={false} name="支出" />
          <Line type="monotone" dataKey="saving" stroke="#6c8fff" strokeWidth={2} dot={false} name="貯蓄" />
          {data.some((d) => d.budget !== undefined) && (
            <Line type="monotone" dataKey="budget" stroke="#ffb547" strokeWidth={2} dot={false} name="予算上限" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
