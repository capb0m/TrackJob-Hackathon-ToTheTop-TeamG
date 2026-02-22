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
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="year" stroke="#7a8aaa" fontSize={12} />
          <YAxis stroke="#7a8aaa" fontSize={12} />
          <Tooltip
            formatter={(value: number) => `¥${value.toLocaleString('ja-JP')}`}
            contentStyle={{
              background: '#131929',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
            }}
          />
          <Legend />
          <ReferenceLine y={targetLine} stroke="#ff7eb3" strokeDasharray="6 4" label="目標ライン" />
          <Area type="monotone" dataKey="p5" stackId="band" stroke="transparent" fill="rgba(108,143,255,0.08)" />
          <Area type="monotone" dataKey="range" stackId="band" stroke="transparent" fill="rgba(108,143,255,0.2)" name="90%信頼区間" />
          <Line type="monotone" dataKey="p50" stroke="#4af0b0" strokeWidth={3} dot={false} name="中央値 p50" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
