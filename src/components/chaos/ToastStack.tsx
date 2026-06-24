'use client'
import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, Skull, Flame, X } from 'lucide-react'

export type ToastKind = 'critical' | 'resolved' | 'info' | 'scenario'

export interface ChaosToast {
  id: number
  kind: ToastKind
  title: string
  message: string
  service?: string
  createdAt: number
}

const KIND_CONFIG: Record<
  ToastKind,
  { icon: React.ComponentType<{ className?: string }>; color: string; label: string }
> = {
  critical: { icon: Skull, color: 'var(--color-negative)', label: 'CRITICAL' },
  resolved: { icon: CheckCircle2, color: 'var(--color-positive)', label: 'RESOLVED' },
  info: { icon: Info, color: 'var(--color-info)', label: 'INFO' },
  scenario: { icon: Flame, color: 'var(--color-accent)', label: 'SCENARIO' },
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ChaosToast[]
  onDismiss: (id: number) => void
}) {
  return null
}

export function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ChaosToast
  onDismiss: (id: number) => void
}) {
  const cfg = KIND_CONFIG[toast.kind]
  const Icon = cfg.icon
  return (
    <div className="pointer-events-auto border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3">
      <div className="flex items-start gap-3">
        <span style={{ color: cfg.color }} className="shrink-0"><Icon className="size-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: cfg.color }}>
            {cfg.label}{toast.service && ` · ${toast.service}`}
          </div>
          <div className="mt-0.5 text-[13px] text-[var(--color-ink)]">{toast.title}</div>
          <div className="mt-1 line-clamp-2 text-[11px] text-[var(--color-ink-muted)]">{toast.message}</div>
        </div>
        <button onClick={() => onDismiss(toast.id)} className="shrink-0 text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]">
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  )
}

export function useChaosToasts() {
  const [toasts, setToasts] = useState<ChaosToast[]>([])
  const nextIdRef = useRef(1)

  const pushToast = (toast: Omit<ChaosToast, 'id' | 'createdAt'>) => {
    const id = nextIdRef.current++
    setToasts((prev) => [...prev, { ...toast, id, createdAt: Date.now() }].slice(-4))
    return id
  }
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id))
  return { toasts, pushToast, dismissToast }
}
