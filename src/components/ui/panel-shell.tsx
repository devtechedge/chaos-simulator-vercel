// Reusable editorial wrappers for all chaos components
import type { ReactNode } from 'react'

export function PanelShell({
  category,
  title,
  subtitle,
  caption,
  children,
}: {
  category: string
  title: string
  subtitle?: string
  caption?: string
  children: ReactNode
}) {
  return (
    <div className="fade-in">
      <header className="mb-8">
        <div className="label label-accent mb-2">{category}</div>
        <h2 className="font-display text-[28px] font-medium leading-tight tracking-tight text-[var(--color-ink)]">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">
            {subtitle}
          </p>
        )}
        {caption && (
          <p className="mt-3 max-w-2xl text-[12px] leading-relaxed text-[var(--color-ink-subtle)]">
            {caption}
          </p>
        )}
      </header>
      {children}
    </div>
  )
}

export function Section({
  label,
  title,
  caption,
  children,
  className = '',
}: {
  label?: string
  title?: string
  caption?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      {(label || title || caption) && (
        <>
          <div className="rule" />
          <div className="py-4">
            {label && <div className="label mb-1">{label}</div>}
            {title && (
              <h3 className="font-display text-[18px] font-medium leading-tight tracking-tight text-[var(--color-ink)]">
                {title}
              </h3>
            )}
            {caption && (
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-subtle)]">
                {caption}
              </p>
            )}
          </div>
        </>
      )}
      {children}
    </section>
  )
}

export function DataRow({
  primary,
  secondary,
  trailing,
  className = '',
}: {
  primary: ReactNode
  secondary?: ReactNode
  trailing?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 border-b border-[var(--color-border)] py-3 data-row ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[13px] text-[var(--color-ink)]">{primary}</div>
        {secondary && (
          <div className="mt-0.5 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
            {secondary}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  )
}

export function KpiStrip({
  items,
}: {
  items: { label: string; value: string; accent?: boolean }[]
}) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--color-border)] py-5 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="label mb-1">{item.label}</div>
          <div
            className={`hero-num text-[22px] ${
              item.accent ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink)]'
            }`}
          >
            {item.value}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 shadow-xl">
      {label && (
        <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
          {label}
        </div>
      )}
      <div className="mt-1 space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-baseline gap-2">
            {p.color && (
              <span
                className="inline-block size-1.5 rounded-full"
                style={{ background: p.color }}
              />
            )}
            <span className="font-mono text-[12px] tabular-nums text-[var(--color-ink)]">
              {formatter ? formatter(p.value) : p.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center text-center">
      <p className="text-[13px] text-[var(--color-ink-muted)]">{title}</p>
      {hint && (
        <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-faint)]">
          {hint}
        </p>
      )}
    </div>
  )
}
