'use client'

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface TrendPoint {
  label: string
  expense: number
  saving?: number
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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,74,122,0.12)" />
          <XAxis dataKey="label" stroke="#6b857b" fontSize={12} />
          <YAxis stroke="#6b857b" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(47,74,122,0.12)',
              borderRadius: 12,
              boxShadow: '0 10px 24px rgba(35,55,95,0.08)',
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="expense" stroke="#2fbf8f" strokeWidth={2.4} dot={false} name="支出" />
          {data.some((d) => d.budget !== undefined) && (
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#e9a33f"
              strokeWidth={2.2}
              strokeDasharray="7 6"
              dot={false}
              name="予算上限"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
