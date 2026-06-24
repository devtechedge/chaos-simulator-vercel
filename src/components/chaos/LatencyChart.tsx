'use client'
import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts'
import { PanelShell, ChartTooltip } from '@/components/ui/panel-shell'
import type { LatencySample, ServiceData } from '@/lib/chaos-types'
import { getEngine } from '@/lib/chaos-engine'

const SERVICE_COLOR: Record<string, string> = {
  AuthService: '#a855f7',
  PaymentService: '#10b981',
  InventoryService: '#f59e0b',
}

export function LatencyChart({
  latencyHistory,
  services,
}: {
  latencyHistory: Record<string, LatencySample[]>
  services: ServiceData[]
}) {
  // Fall back to snapshot data when no history passed in
  const engine = useMemo(() => getEngine(), [])
  const allHistory = useMemo(() => {
    if (Object.keys(latencyHistory).length > 0) return latencyHistory
    // Use the engine's actual latency history
    const out: Record<string, LatencySample[]> = {}
    for (const [name, samples] of engine.latencyHistory.entries()) {
      out[name] = samples.slice(-60)
    }
    return out
  }, [latencyHistory, engine])

  const [featuredIdx, setFeaturedIdx] = useState(0)
  const serviceNames = Object.keys(allHistory)
  const featured = serviceNames[featuredIdx] ?? serviceNames[0]
  const featuredSeries = (allHistory[featured] ?? []).slice(-60).map((s, i) => ({
    t: i,
    ms: Math.max(1, s.latencyMs),
    base: s.baselineLatencyMs,
  }))

  return (
    <PanelShell
      category="Telemetry"
      title="Latency Chart"
      subtitle="60-second rolling latency per service · baseline vs current"
      caption="Each line tracks one service. Reference line marks the SLO threshold (50ms). Spikes ≥3% auto-flagged."
    >
      {/* Service selector */}
      <div className="rule" />
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap items-center gap-1">
          {serviceNames.map((name, i) => (
            <button
              key={name}
              onClick={() => setFeaturedIdx(i)}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                i === featuredIdx
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <span className="font-mono text-[11px] tabular-nums text-[var(--color-ink-subtle)]">
          {featuredSeries.length} samples
        </span>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={featuredSeries} margin={{ top: 16, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="t"
              stroke="var(--color-ink-subtle)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--color-ink-subtle)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v.toFixed(0)}ms`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />
            <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(1)}ms`} />} cursor={{ stroke: 'var(--color-ink-faint)' }} />
            <ReferenceLine
              y={50}
              stroke="var(--color-negative)"
              strokeDasharray="3 3"
              strokeOpacity={0.4}
              label={{
                value: 'SLO',
                position: 'right',
                fill: 'var(--color-negative)',
                fontSize: 9,
                opacity: 0.6,
              }}
            />
            <Line
              type="monotone"
              dataKey="ms"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* All-services mini grid */}
      <div className="rule mt-4" />
      <div className="grid grid-cols-1 gap-px border border-[var(--color-border)] bg-[var(--color-border)] pt-px md:grid-cols-3">
        {serviceNames.slice(0, 3).map((name) => {
          const samples = (allHistory[name] ?? []).slice(-60)
          const last = samples[samples.length - 1]
          const min = Math.min(...samples.map((s) => s.latencyMs))
          const max = Math.max(...samples.map((s) => s.latencyMs))
          return (
            <div
              key={name}
              className="flex flex-col justify-between bg-[var(--color-bg)] p-3"
              style={{ borderLeft: `2px solid ${SERVICE_COLOR[name] ?? 'var(--color-accent)'}` }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  {name}
                </span>
                <span className="font-mono text-[14px] tabular-nums text-[var(--color-ink)]">
                  {last ? `${last.latencyMs.toFixed(0)}ms` : '—'}
                </span>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                min {min.toFixed(0)} · max {max.toFixed(0)} · SLO 50ms
              </div>
            </div>
          )
        })}
      </div>
    </PanelShell>
  )
}

// ============================================================
// ServiceSparkline — small inline chart used by ServiceCard
// ============================================================
export function ServiceSparkline({
  samples,
  color,
}: {
  samples: { latencyMs: number; baselineLatencyMs?: number }[]
  color: string
}) {
  if (!samples || samples.length === 0) return null
  const data = samples.slice(-30).map((s, i) => ({ t: i, ms: s.latencyMs }))
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="ms"
            stroke={color}
            strokeWidth={1.25}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
