'use client'

import { useEffect, useMemo, useState } from 'react'
import { Shield, Zap, Server } from 'lucide-react'
import type { ServiceData } from '@/lib/chaos-types'
import { PanelShell } from '@/components/ui/panel-shell'

interface Node { id: string; label: string; x: number; y: number; color: string; service?: ServiceData }

const SVG_W = 760
const SVG_H = 360
const GATEWAY: Node = { id: 'gateway', label: 'API Gateway', x: SVG_W / 2, y: SVG_H / 2, color: 'var(--color-accent)' }

function getHealthColor(svc?: ServiceData) {
  if (!svc) return 'var(--color-ink-faint)'
  if (svc.health === 'Healthy') return 'var(--color-positive)'
  if (svc.health === 'Degraded') return 'var(--color-warning)'
  return 'var(--color-negative)'
}

export function ServiceTopology({ services, chaosEnabled }: { services: ServiceData[]; chaosEnabled: boolean }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let raf: number
    const loop = () => {
      setTick((t) => (t + 1) % 1_000_000)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const nodes: Node[] = useMemo(() => {
    return services.map((svc, i) => {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI) / Math.max(services.length, 3)
      const radius = 130
      return {
        id: svc.name,
        label: svc.name,
        x: GATEWAY.x + Math.cos(angle) * radius,
        y: GATEWAY.y + Math.sin(angle) * radius,
        color: 'var(--color-ink-muted)',
        service: svc,
      }
    })
  }, [services])

  return (
    <PanelShell
      category="Telemetry"
      title="Service Topology"
      subtitle="Live gateway-to-service mesh"
      caption="Animated SVG of the gateway → 3 services graph. Particle speed reflects the source service's health."
    >
      <div className="rule" />
      <div className="relative w-full pt-6">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full" style={{ maxHeight: 420 }}>
          <defs>
            {nodes.map((node) => (
              <linearGradient key={`grad-${node.id}`} id={`grad-${node.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.8" />
                <stop offset="100%" stopColor={getHealthColor(node.service)} stopOpacity="0.8" />
              </linearGradient>
            ))}
            <radialGradient id="gateway-grad">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background grid */}
          {Array.from({ length: 12 }).map((_, i) => (
            <line key={`grid-h-${i}`} x1="0" y1={(i + 1) * (SVG_H / 12)} x2={SVG_W} y2={(i + 1) * (SVG_H / 12)} stroke="var(--color-border)" strokeWidth="1" />
          ))}
          {Array.from({ length: 8 }).map((_, i) => (
            <line key={`grid-v-${i}`} x1={(i + 1) * (SVG_W / 8)} y1="0" x2={(i + 1) * (SVG_W / 8)} y2={SVG_H} stroke="var(--color-border)" strokeWidth="1" />
          ))}

          {/* Edges */}
          {nodes.map((node) => {
            const health = node.service?.health || 'Healthy'
            const isDown = health === 'Down'
            const edgeColor = getHealthColor(node.service)
            return (
              <g key={`edge-${node.id}`}>
                <line x1={GATEWAY.x} y1={GATEWAY.y} x2={node.x} y2={node.y} stroke={edgeColor} strokeOpacity={isDown ? 0.15 : 0.3} strokeWidth="1.5" />
                {!isDown && (
                  <line x1={GATEWAY.x} y1={GATEWAY.y} x2={node.x} y2={node.y} stroke={`url(#grad-${node.id})`} strokeWidth="2" strokeDasharray="6 12" strokeDashoffset={-tick * 2} opacity="0.6" />
                )}
                {!isDown && Array.from({ length: 3 }).map((_, i) => {
                  const speed = health === 'Degraded' ? 0.0015 : 0.003
                  const phase = (tick * speed + i / 3) % 1
                  const px = GATEWAY.x + (node.x - GATEWAY.x) * phase
                  const py = GATEWAY.y + (node.y - GATEWAY.y) * phase
                  return <circle key={`p-${node.id}-${i}`} cx={px} cy={py} r="3" fill={edgeColor} opacity="0.9" />
                })}
              </g>
            )
          })}

          {/* Gateway halo */}
          <circle cx={GATEWAY.x} cy={GATEWAY.y} r="70" fill="url(#gateway-grad)" />
          {[0, 1, 2].map((i) => {
            const phase = (tick * 0.01 + i / 3) % 1
            return (
              <circle key={`gw-pulse-${i}`} cx={GATEWAY.x} cy={GATEWAY.y} r={30 + phase * 60} fill="none" stroke="var(--color-accent)" strokeOpacity={Math.max(0, 1 - phase) * 0.4} strokeWidth="1.5" />
            )
          })}

          {/* Gateway */}
          <circle cx={GATEWAY.x} cy={GATEWAY.y} r="38" fill="var(--color-accent)" fillOpacity="0.15" stroke="var(--color-accent)" strokeWidth="2" />
          <text x={GATEWAY.x} y={GATEWAY.y + 4} textAnchor="middle" fill="var(--color-accent)" fontSize="13" fontWeight="700">GW</text>
          <text x={GATEWAY.x} y={GATEWAY.y + 60} textAnchor="middle" fill="var(--color-ink-muted)" fontSize="10" fontWeight="600" letterSpacing="1">API GATEWAY</text>

          {/* Service nodes */}
          {nodes.map((node) => {
            const svc = node.service
            const health = svc?.health || 'Healthy'
            const isDown = health === 'Down'
            const isDegraded = health === 'Degraded'
            const healthColor = getHealthColor(svc)
            return (
              <g key={`node-${node.id}`}>
                {(isDown || isDegraded) && [0, 1].map((i) => {
                  const phase = (tick * 0.012 + i / 2) % 1
                  return (
                    <circle key={`pulse-${node.id}-${i}`} cx={node.x} cy={node.y} r={28 + phase * 20} fill="none" stroke={healthColor} strokeOpacity={Math.max(0, 1 - phase) * 0.7} strokeWidth="2" />
                  )
                })}
                <circle cx={node.x} cy={node.y} r="32" fill={healthColor} fillOpacity="0.15" stroke={healthColor} strokeWidth="2" style={{ filter: `drop-shadow(0 0 12px ${healthColor})` }} />
                <text x={node.x} y={node.y + 5} textAnchor="middle" fill={healthColor} fontSize="12" fontWeight="700">
                  {node.id.slice(0, 4).toUpperCase()}
                </text>
                <text x={node.x} y={node.y - 50} textAnchor="middle" fill={healthColor} fontSize="9" fontWeight="600" letterSpacing="0.5">
                  {isDown ? 'DOWN' : isDegraded ? 'DEGRADED' : 'OK'}
                </text>
                <text x={node.x} y={node.y + 50} textAnchor="middle" fill="var(--color-ink-muted)" fontSize="10" fontWeight="500">{node.id}</text>
                <text x={node.x} y={node.y + 64} textAnchor="middle" fill="var(--color-ink-subtle)" fontSize="9" fontFamily="monospace">
                  {svc ? `${svc.latencyMs.toFixed(0)}ms` : '---'}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-[var(--color-border)] pt-3 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="status-dot bg-[var(--color-positive)]" />
            <span className="text-[var(--color-ink-muted)]">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-[var(--color-warning)]" />
            <span className="text-[var(--color-ink-muted)]">Degraded</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="status-dot bg-[var(--color-negative)]" />
            <span className="text-[var(--color-ink-muted)]">Down</span>
          </div>
          {chaosEnabled && (
            <div className="ml-auto flex items-center gap-2">
              <span className="status-dot bg-[var(--color-accent)]" />
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-accent)]">Chaos Engine ARMED</span>
            </div>
          )}
        </div>
      </div>
    </PanelShell>
  )
}
