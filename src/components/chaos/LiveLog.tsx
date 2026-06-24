'use client'
import { useEffect, useRef, useState } from 'react'
import { PanelShell } from '@/components/ui/panel-shell'
import type { LogEvent } from '@/lib/chaos-types'

const LEVEL_COLOR: Record<string, string> = {
  INFO: 'var(--color-info)',
  WARN: 'var(--color-warning)',
  CRITICAL: 'var(--color-negative)',
  RESOLVED: 'var(--color-positive)',
}

const FILTERS = ['ALL', 'INFO', 'WARN', 'CRITICAL', 'RESOLVED'] as const

export function LiveLog({ logs }: { logs: LogEvent[] }) {
  const [filter, setFilter] = useState<typeof FILTERS[number]>('ALL')
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = filter === 'ALL' ? logs : logs.filter((l) => l.level === filter)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isNearBottom) el.scrollTop = el.scrollHeight
  }, [filtered.length])

  return (
    <PanelShell
      category="Diagnostics"
      title="Live Event Stream"
      subtitle={`${logs.length} events · ${filtered.length} matching filter`}
      caption="Real-time stream of chaos injections, recoveries, and operator actions. Auto-scrolls to newest unless you've scrolled up."
    >
      <div className="rule" />
      <div className="flex flex-wrap items-center gap-1 py-3">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-colors ${
              filter === f
                ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                : 'text-[var(--color-ink-subtle)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="h-[480px] overflow-y-auto border border-[var(--color-border)] bg-[var(--color-surface)] font-mono text-[11px]">
        {filtered.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            Waiting for events...
          </div>
        ) : (
          filtered.slice(-100).map((log, i) => (
            <div
              key={log.id || i}
              className="flex items-baseline gap-3 border-b border-[var(--color-border)] px-3 py-1.5 data-row"
            >
              <span className="shrink-0 font-mono text-[10px] tabular-nums text-[var(--color-ink-faint)]">
                [{log.timestamp}]
              </span>
              <span
                className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: LEVEL_COLOR[log.level] }}
              >
                {log.level}
              </span>
              <span className="shrink-0 text-[var(--color-ink-muted)]">{log.service}</span>
              <span className="text-[var(--color-ink)]">{log.message}</span>
            </div>
          ))
        )}
      </div>
      <div className="rule mt-1" />
    </PanelShell>
  )
}
