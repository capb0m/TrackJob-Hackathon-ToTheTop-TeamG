'use client'

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ProjectionPoint {
  year: number
  p5: number
  p50: number
  p95: number
}

interface ProjectionChartProps {
  data: ProjectionPoint[]
  targetLine?: number
}

export function ProjectionChart({ data, targetLine = 5000000 }: ProjectionChartProps) {
  const bandData = data.map((item) => ({ ...item, range: item.p95 - item.p5 }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <ComposedChart data={bandData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(47,74,122,0.12)" />
          <XAxis dataKey="year" stroke="#6b857b" fontSize={12} />
          <YAxis stroke="#6b857b" fontSize={12} />
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString('ja-JP')}`}
            contentStyle={{
              background: '#ffffff',
              border: '1px solid rgba(47,74,122,0.12)',
              borderRadius: 12,
              boxShadow: '0 10px 24px rgba(35,55,95,0.08)',
            }}
          />
          <Legend />
          <ReferenceLine y={targetLine} stroke="#e96b7f" strokeDasharray="6 4" label="目標ライン" />
          <Area type="monotone" dataKey="p5" stackId="band" stroke="transparent" fill="rgba(47,191,143,0.08)" />
          <Area type="monotone" dataKey="range" stackId="band" stroke="transparent" fill="rgba(47,191,143,0.2)" name="90%信頼区間" />
          <Line type="monotone" dataKey="p50" stroke="#2fbf8f" strokeWidth={3} dot={false} name="中央値 p50" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
