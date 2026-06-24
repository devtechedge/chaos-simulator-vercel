'use client'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Zap, Server } from 'lucide-react'
import type { ServiceData, LatencySample } from '@/lib/chaos-types'
import { ServiceSparkline } from './LatencyChart'

interface Props {
  service: ServiceData
  latencySamples: LatencySample[]
  onRestart: () => void
  onInjectAnomaly: (type: '500_ERROR' | 'LATENCY_SPIKE' | 'SERVICE_CRASH') => void
  index: number
}

const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  AuthService: Shield,
  PaymentService: Zap,
  InventoryService: Server,
}

const cardVariants = {
  healthy: {
    backgroundColor: 'var(--color-surface)',
    borderColor: 'var(--color-border)',
    boxShadow: '0 0 0 transparent',
  },
  degraded: {
    backgroundColor: 'var(--color-warning-soft)',
    borderColor: 'var(--color-warning)',
    boxShadow: '0 0 35px -10px var(--color-warning)',
  },
  down: {
    backgroundColor: 'var(--color-negative-soft)',
    borderColor: 'var(--color-negative)',
    boxShadow: '0 0 45px -8px var(--color-negative)',
  },
}

const HEALTH_BADGE = {
  Healthy: { dot: 'var(--color-positive)', label: 'HEALTHY' },
  Degraded: { dot: 'var(--color-warning)', label: 'DEGRADED' },
  Down: { dot: 'var(--color-negative)', label: 'DOWN' },
} as const

export function ServiceCard({ service, latencySamples, onRestart, onInjectAnomaly, index }: Props) {
  const Icon = SERVICE_ICONS[service.name] || Server
  const variant = service.health === 'Down' ? 'down' : service.health === 'Degraded' ? 'degraded' : 'healthy'
  const badge = HEALTH_BADGE[service.health]

  return (
    <motion.div animate={cardVariants[variant]} transition={{ duration: 0.4 }}>
      <Card className="border-transparent bg-transparent">
        <CardContent className="p-5">
          <div className="mb-3 flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span style={{ color: 'var(--color-ink-muted)' }}><Icon className="size-4" /></span>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-ink)]">{service.name}</h3>
                <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  Microservice
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="status-dot" style={{ background: badge.dot }} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: badge.dot }}>
                {badge.label}
              </span>
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px]">
              <span className="text-[var(--color-ink-subtle)]">Latency</span>
              <span className="font-mono tabular-nums text-[var(--color-ink)]">
                {service.isCrashed ? '---' : `${service.latencyMs.toFixed(0)}ms`}
              </span>
            </div>
            <ServiceSparkline samples={latencySamples} color="var(--color-accent)" />
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 text-[11px]">
            <button
              onClick={() => onInjectAnomaly('500_ERROR')}
              className="border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-negative)] hover:text-[var(--color-negative)]"
            >
              Inject 500
            </button>
            <button
              onClick={() => onInjectAnomaly('LATENCY_SPIKE')}
              className="border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-warning)] hover:text-[var(--color-warning)]"
            >
              Spike
            </button>
            <button
              onClick={() => onInjectAnomaly('SERVICE_CRASH')}
              className="border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-2 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-negative)] hover:text-[var(--color-negative)]"
            >
              Crash
            </button>
          </div>

          <button
            onClick={onRestart}
            className="flex w-full items-center justify-center border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Restart service
          </button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
