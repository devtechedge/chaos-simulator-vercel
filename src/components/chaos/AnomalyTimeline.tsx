'use client'
import { useMemo, useState } from 'react'
// framer-motion removed (React 19 incompat)
import { PanelShell, DataRow } from '@/components/ui/panel-shell'
import { getEngine } from '@/lib/chaos-engine'
import type { AnomalyHistoryEntry } from '@/lib/chaos-types'
import { AlertCircle, Skull, Flame, Bomb } from 'lucide-react'

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  '500_ERROR': Bomb,
  LATENCY_SPIKE: AlertCircle,
  SERVICE_CRASH: Skull,
  NETWORK_PARTITION: Flame,
}

export function AnomalyTimeline({ entries }: { entries: AnomalyHistoryEntry[] }) {
  const [serviceFilter, setServiceFilter] = useState('ALL')
  const [showResolvedOnly, setShowResolvedOnly] = useState(false)

  // Use snapshot data if no entries passed
  const snap = useMemo(() => (entries.length === 0 ? getEngine() : null), [entries])
  const allEntries = entries.length > 0 ? entries : (snap?.anomalyHistory ?? [])

  const filtered = useMemo(() => {
    return allEntries
      .filter((e) => serviceFilter === 'ALL' || e.serviceName === serviceFilter)
      .filter((e) => !showResolvedOnly || e.resolvedAt !== null)
      .slice()
      .reverse()
  }, [allEntries, serviceFilter, showResolvedOnly])

  const services = Array.from(new Set(allEntries.map((e) => e.serviceName)))

  return (
    <PanelShell
      category="Operations"
      title="Anomaly Timeline"
      subtitle={`${allEntries.length} anomalies · ${filtered.length} matching filter`}
      caption="Auto-injected by the chaos loop or triggered manually. Each entry tracks start, resolution, and recovery time."
    >
      <div className="rule" />
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="flex flex-wrap items-center gap-1">
          <button
            onClick={() => setServiceFilter('ALL')}
            className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
              serviceFilter === 'ALL'
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
            }`}
          >
            All
          </button>
          {services.map((s) => (
            <button
              key={s}
              onClick={() => setServiceFilter(s)}
              className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                serviceFilter === s
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowResolvedOnly(!showResolvedOnly)}
          className={`rounded px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
            showResolvedOnly
              ? 'bg-[var(--color-positive-soft)] text-[var(--color-positive)]'
              : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
          }`}
        >
          {showResolvedOnly ? '✓ Resolved only' : 'Resolved only'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[12px] text-[var(--color-ink-subtle)]">
          No anomalies match the current filter
        </div>
      ) : (
        <div>
          {filtered.slice(0, 30).map((entry, i) => {
            const Icon = TYPE_ICON[entry.type] || AlertCircle
            const isResolved = entry.resolvedAt !== null
            return (
              <article
                key={entry.id || i}
                className="grid grid-cols-1 gap-3 border-b border-[var(--color-border)] py-4 transition-colors hover:bg-[var(--color-surface)] md:grid-cols-[1fr,140px,100px]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="size-3.5 text-[var(--color-accent)]" />
                    <span className="text-[13px] text-[var(--color-ink)]">
                      {entry.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                      · {entry.serviceName}
                    </span>
                  </div>
                  <div className="mt-1.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
                    {new Date(entry.startedAt).toLocaleString()} · {entry.triggeredBy}
                  </div>
                </div>
                <div className="font-mono text-[11px] tabular-nums text-[var(--color-ink-muted)] md:text-right">
                  {isResolved && entry.recoveryTimeMs
                    ? `recovered in ${(entry.recoveryTimeMs / 1000).toFixed(1)}s`
                    : 'ongoing'}
                </div>
                <div className="md:text-right">
                  <span
                    className={`text-[10px] uppercase tracking-[0.14em] ${
                      isResolved ? 'text-[var(--color-positive)]' : 'text-[var(--color-negative)]'
                    }`}
                  >
                    {isResolved ? 'Resolved' : 'Active'}
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      )}
      <div className="rule mt-1" />
    </PanelShell>
  )
}
