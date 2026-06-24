'use client'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'

type ConnState = 'connected' | 'connecting' | 'reconnecting' | 'disconnected'

const CONFIG: Record<
  ConnState,
  { icon: React.ComponentType<{ className?: string }>; label: string; color: string }
> = {
  connected: { icon: Wifi, label: 'LIVE', color: 'var(--color-positive)' },
  connecting: { icon: Loader2, label: 'CONNECTING', color: 'var(--color-warning)' },
  reconnecting: { icon: Loader2, label: 'RECONNECTING', color: 'var(--color-warning)' },
  disconnected: { icon: WifiOff, label: 'OFFLINE', color: 'var(--color-negative)' },
}

export function ConnectionIndicator({ state }: { state: ConnState }) {
  const cfg = CONFIG[state]
  const Icon = cfg.icon
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color: cfg.color }}><Icon className="size-3" /></span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: cfg.color }}>
        {cfg.label}
      </span>
    </div>
  )
}
