'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import type { LatencySample, ServiceData } from '@/lib/chaos-types'
import { SERVICE_META, SERVICE_NAMES } from '@/lib/chaos-types'

interface Props {
  latencyHistory: Record<string, LatencySample[]>
  services: ServiceData[]
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return `${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

export function LatencyChart({ latencyHistory, services }: Props) {
  const chartData = useMemo(() => {
    const allTimestamps = new Set<number>()
    for (const name of SERVICE_NAMES) {
      const samples = latencyHistory[name] || []
      for (const s of samples) allTimestamps.add(s.timestamp)
    }
    const sorted = Array.from(allTimestamps).sort((a, b) => a - b)
    return sorted.map((ts) => {
      const row: Record<string, number | string> = { timestamp: ts, time: formatTime(ts) }
      for (const name of SERVICE_NAMES) {
        const samples = latencyHistory[name] || []
        const found = samples.find((s) => s.timestamp === ts)
        row[name] = found ? found.latencyMs : 0
      }
      return row
    })
  }, [latencyHistory])

  const maxLatency = useMemo(() => {
    let max = 200
    for (const name of SERVICE_NAMES) {
      const samples = latencyHistory[name] || []
      for (const s of samples) {
        if (s.latencyMs > max) max = s.latencyMs
      }
    }
    return Math.ceil(max * 1.15)
  }, [latencyHistory])

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
          <defs>
            {SERVICE_NAMES.map((name) => (
              <linearGradient key={name} id={`grad-${name}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERVICE_META[name].color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERVICE_META[name].color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 6" stroke="var(--border)" />
          <XAxis
            dataKey="time"
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={50}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={[0, maxLatency]}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              fontSize: '11px',
              color: 'var(--foreground)',
              boxShadow: 'var(--glass-shadow-lg)',
            }}
            labelStyle={{ color: 'var(--muted-foreground)' }}
            formatter={(value: number, name: string) => [`${value}ms`, name]}
          />
          <ReferenceLine
            y={500}
            stroke="var(--status-down)"
            strokeDasharray="4 4"
            strokeOpacity={0.4}
            label={{
              value: 'SLO threshold',
              position: 'insideTopRight',
              fill: 'var(--status-down)',
              fillOpacity: 0.6,
              fontSize: 9,
            }}
          />
          {SERVICE_NAMES.map((name) => {
            const svc = services.find((s) => s.name === name)
            const isDown = svc?.health === 'Down'
            const color = SERVICE_META[name].color
            return (
              <Area
                key={`area-${name}`}
                type="monotone"
                dataKey={name}
                stroke={color}
                strokeWidth={isDown ? 1.5 : 2}
                strokeOpacity={isDown ? 0.4 : 1}
                fill={`url(#grad-${name})`}
                fillOpacity={isDown ? 0.1 : 0.5}
                isAnimationActive={false}
                dot={false}
                activeDot={{ r: 4, fill: color, stroke: 'var(--background)', strokeWidth: 2 }}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// Smaller per-service sparkline for ServiceCard
export function ServiceSparkline({ samples, color }: { samples: LatencySample[]; color: string }) {
  const data = useMemo(
    () =>
      samples.slice(-30).map((s) => ({
        time: formatTime(s.timestamp),
        latency: s.latencyMs,
      })),
    [samples]
  )
  if (data.length === 0) return null
  return (
    <div className="w-full h-[36px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Area
            type="monotone"
            dataKey="latency"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
            fill={color}
            fillOpacity={0.12}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}