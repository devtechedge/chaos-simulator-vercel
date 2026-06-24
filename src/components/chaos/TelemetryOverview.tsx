'use client'

import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { getOverview } from '@/lib/chaos-engine'
import { ChartTooltip } from '@/components/ui/panel-shell'
import { fmtNum } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Activity, Globe, Zap, AlertTriangle, Flame, Server } from 'lucide-react'

export function TelemetryOverview() {
  const data = useMemo(() => getOverview(), [])
  const o = data

  const metrics = [
    { label: 'Active Services', value: `${o.activeServices ?? 0}/3`, trend: null, accent: false },
    { label: 'Outages Prevented', value: fmtNum(o.outagesPrevented ?? 0), trend: null, accent: false },
    { label: 'Chaos Cycles', value: fmtNum(o.chaosCycles ?? 0), trend: null, accent: false },
    { label: 'Avg Latency', value: `${(o.avgLatencyMs ?? 0).toFixed(0)}ms`, trend: null, accent: false },
    { label: 'Avg Disparity', value: `${(o.avgDisparity ?? 0).toFixed(2)}%`, trend: 'up', accent: true },
    { label: 'Max Disparity', value: `${(o.maxDisparity ?? 0).toFixed(1)}%`, trend: 'up', accent: true },
    { label: 'Limited Stock', value: fmtNum(o.limitedStockCount ?? 0), trend: 'down', accent: false },
    { label: 'Avg Hype', value: String(o.avgHypeScore ?? 0), trend: null, accent: false },
  ]

  return (
    <div className="fade-in">
      {/* HERO */}
      <section className="pb-10">
        <div className="mb-3 flex items-baseline gap-3">
          <span className="label label-accent">Live Telemetry</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
            Polling 1Hz · Self-healing recovery worker active
          </span>
        </div>

        <div className="mb-8 flex items-baseline gap-4">
          <span className="hero-num text-[80px] text-[var(--color-ink)]">
            {o.activeServices ?? 0}
            <span className="text-[44px] text-[var(--color-ink-subtle)]">/3</span>
          </span>
          <div className="pb-3">
            <div className="label">Services reporting HEALTHY</div>
            <div className="mt-1 flex items-center gap-1 text-[12px] text-[var(--color-ink-muted)]">
              <ArrowUpRight className="size-3.5 text-[var(--color-positive)]" />
              <span>3 microservices · 90-second recovery SLO</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--color-border)] pt-6 md:grid-cols-4 lg:grid-cols-8">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="label mb-1">{m.label}</div>
              <div
                className={`hero-num text-[26px] ${
                  m.accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
                }`}
              >
                {m.value}
              </div>
              {m.trend && (
                <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[var(--color-ink-subtle)]">
                  {m.trend === 'up' ? (
                    <ArrowUpRight className="size-2.5 text-[var(--color-negative)]" />
                  ) : (
                    <ArrowDownRight className="size-2.5 text-[var(--color-positive)]" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CHARTS */}
      <section className="grid grid-cols-1 gap-8 border-t border-[var(--color-border)] pt-10 lg:grid-cols-2">
        <div>
          <div className="rule" />
          <div className="py-4">
            <div className="label">Avg Latency by Service</div>
            <h3 className="font-display text-[17px] font-medium leading-tight tracking-tight text-[var(--color-ink)]">
              Baseline vs current latency
            </h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.serviceLatency}
                layout="vertical"
                margin={{ left: 0, right: 24, top: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="var(--color-border)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="var(--color-ink-subtle)"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}ms`}
                />
                <YAxis
                  dataKey="service"
                  type="category"
                  stroke="var(--color-ink-muted)"
                  fontSize={11}
                  width={120}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip formatter={(v) => `${v.toFixed(0)}ms`} />} cursor={{ fill: 'var(--color-surface-2)' }} />
                <Bar dataKey="latencyMs" fill="var(--color-accent)" radius={[0, 1, 1, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <div className="rule" />
          <div className="py-4">
            <div className="label">Anomaly History</div>
            <h3 className="font-display text-[17px] font-medium leading-tight tracking-tight text-[var(--color-ink)]">
              Total anomalies injected
            </h3>
          </div>
          <div className="flex h-56 flex-col items-center justify-center">
            <div className="hero-num text-[64px] text-[var(--color-accent)]">
              {fmtNum(o.totalAnomalies ?? 0)}
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
              {fmtNum(o.resolvedAnomalies ?? 0)} resolved · {fmtNum(o.activeAnomalies ?? 0)} active
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
