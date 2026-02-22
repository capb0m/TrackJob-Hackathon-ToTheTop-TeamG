'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface PieData {
  name: string
  value: number
  color: string
}

interface ExpensePieChartProps {
  data: PieData[]
}

export function ExpensePieChart({ data }: ExpensePieChartProps) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={52}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString('ja-JP')}`}
            contentStyle={{
              background: '#131929',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
