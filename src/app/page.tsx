'use client'

import { useState } from 'react'
import type { ComponentType } from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme'

import { TelemetryOverview } from '@/components/chaos/TelemetryOverview'
import { ServiceTopology } from '@/components/chaos/ServiceTopology'
import { AnomalyTimeline } from '@/components/chaos/AnomalyTimeline'
import { LatencyChart } from '@/components/chaos/LatencyChart'
import { ChaosScenarioBuilder } from '@/components/chaos/ChaosScenarioBuilder'
import { ParticleOverlay } from '@/components/chaos/ParticleOverlay'
import { ToastStack, useChaosToasts } from '@/components/chaos/ToastStack'
import { LiveLog } from '@/components/chaos/LiveLog'
import { ConnectionIndicator } from '@/components/chaos/ConnectionIndicator'

type PanelId =
  | 'overview'
  | 'topology'
  | 'anomaly'
  | 'latency'
  | 'scenario'
  | 'log'

interface NavItem {
  id: PanelId
  label: string
  category: 'Telemetry' | 'Operations' | 'Diagnostics'
}

const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', category: 'Telemetry' },
  { id: 'topology', label: 'Service Topology', category: 'Telemetry' },
  { id: 'latency', label: 'Latency Chart', category: 'Telemetry' },
  { id: 'anomaly', label: 'Anomaly Timeline', category: 'Operations' },
  { id: 'scenario', label: 'Chaos Scenarios', category: 'Operations' },
  { id: 'log', label: 'Live Event Log', category: 'Diagnostics' },
]

export default function Dashboard() {
  const [activePanel, setActivePanel] = useState<PanelId>('overview')
  const { theme, toggle, hydrated } = useTheme()

  const grouped = NAV.reduce<Record<string, NavItem[]>>((acc, item) => {
    ;(acc[item.category] = acc[item.category] || []).push(item)
    return acc
  }, {})

  const activeItem = NAV.find((n) => n.id === activePanel)

  return (
    <div className="min-h-screen">
      {/* Particle overlay — full screen (only renders in browser) */}
      <ParticleOverlay />

      <ToastStack toasts={[]} onDismiss={() => {}} />

      <div className="relative mx-auto flex max-w-[1500px] gap-0">
        {/* SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg)] lg:block">
          <div className="flex h-full flex-col">
            <div className="px-6 pt-7 pb-6">
              <div className="flex items-baseline gap-2">
                <span className="font-display text-xl font-medium tracking-tight text-[var(--color-ink)]">
                  Chaos
                </span>
                <span className="font-display text-xl font-medium tracking-tight text-[var(--color-accent)]">
                  Simulator
                </span>
              </div>
              <p className="mt-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                Microservice Telemetry · v3.0
              </p>
            </div>
            <div className="rule mx-6" />

            <nav className="flex-1 overflow-y-auto px-3 py-5">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-5">
                  <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                    {category}
                  </div>
                  <ul className="space-y-px">
                    {items.map((item) => {
                      const isActive = activePanel === item.id
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => setActivePanel(item.id)}
                            className={`flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left text-[13px] transition-colors ${
                              isActive
                                ? 'bg-[var(--color-surface-2)] text-[var(--color-ink)]'
                                : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-ink)]'
                            }`}
                          >
                            <span>{item.label}</span>
                            {isActive && (
                              <span className="size-1 rounded-full bg-[var(--color-accent)]" />
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            <div className="border-t border-[var(--color-border)] px-6 py-4">
              <div className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-ink-faint)]">
                Connection
              </div>
              <div className="mt-2">
                <ConnectionIndicator state="connected" />
              </div>
              <div className="mt-3 text-[11px] leading-relaxed text-[var(--color-ink-subtle)]">
                In-memory · polling 1Hz · watchlist local
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-8 py-4 backdrop-blur-md">
            <div className="flex items-baseline gap-3">
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)]">
                {activeItem?.category ?? 'Chaos'}
              </span>
              <span className="text-[var(--color-ink-faint)]">/</span>
              <h1 className="font-display text-base font-medium tracking-tight text-[var(--color-ink)]">
                {activeItem?.label ?? 'Overview'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} toggle={toggle} hydrated={hydrated} />
            </div>
          </header>

          <div key={activePanel} className="fade-in px-8 py-8">
            {activePanel === 'overview' && <TelemetryOverview />}
            {activePanel === 'topology' && <ServiceTopologyView />}
            {activePanel === 'latency' && <LatencyChartView />}
            {activePanel === 'anomaly' && <AnomalyTimelineView />}
            {activePanel === 'scenario' && <ChaosScenarioBuilderView />}
            {activePanel === 'log' && <LiveLogView />}
          </div>
        </main>
      </div>
    </div>
  )
}

// === Thin wrapper views that compose existing components ===
import { ServiceTopology as _ServiceTopology } from '@/components/chaos/ServiceTopology'
import { LatencyChart as _LatencyChart } from '@/components/chaos/LatencyChart'
import { AnomalyTimeline as _AnomalyTimeline } from '@/components/chaos/AnomalyTimeline'
import { ChaosScenarioBuilder as _ChaosScenarioBuilder } from '@/components/chaos/ChaosScenarioBuilder'
import { LiveLog as _LiveLog } from '@/components/chaos/LiveLog'
import { PanelShell } from '@/components/ui/panel-shell'

function ServiceTopologyView() {
  return (
    <PanelShell
      category="Telemetry"
      title="Service Topology"
      subtitle="Live gateway-to-service mesh with particle data flow"
      caption="Animated SVG of the gateway → 3 services graph. Particle speed reflects the source service's health."
    >
      <_ServiceTopology services={[]} chaosEnabled={true} />
    </PanelShell>
  )
}

function LatencyChartView() {
  return (
    <PanelShell
      category="Telemetry"
      title="Latency Chart"
      subtitle="60-second rolling latency per service · baseline vs current"
      caption="Each line is one service. Reference line marks the SLO threshold. Anomalies (≥3% moves) flagged automatically."
    >
      <_LatencyChart latencyHistory={{}} services={[]} />
    </PanelShell>
  )
}

function AnomalyTimelineView() {
  return (
    <PanelShell
      category="Operations"
      title="Anomaly Timeline"
      subtitle="Filterable log of all injected anomalies with recovery stats"
      caption="Trigger source is auto (chaos loop), manual (operator), or scenario. Recovery time = resolvedAt − startedAt."
    >
      <_AnomalyTimeline entries={[]} />
    </PanelShell>
  )
}

function ChaosScenarioBuilderView() {
  return (
    <PanelShell
      category="Operations"
      title="Chaos Scenario Builder"
      subtitle="Compose multi-step failure cascades with a 3-step wizard"
      caption="Pick a preset, customize step order, or build from scratch. Each step runs after a configurable delay."
    >
      <_ChaosScenarioBuilder open={true} onClose={() => {}} onRun={() => {}} />
    </PanelShell>
  )
}

function LiveLogView() {
  return (
    <PanelShell
      category="Diagnostics"
      title="Live Event Stream"
      subtitle="Real-time terminal of chaos events, recoveries, and operator actions"
      caption="Each entry shows timestamp, level, service, and message. Auto-scrolls to newest unless you've scrolled up."
    >
      <_LiveLog logs={[]} />
    </PanelShell>
  )
}

function ThemeToggle({
  theme,
  toggle,
  hydrated,
}: {
  theme: 'dark' | 'light'
  toggle: () => void
  hydrated: boolean
}) {
  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--color-ink-muted)] transition-all hover:border-[var(--color-border-strong)] hover:text-[var(--color-ink)]"
    >
      {hydrated && theme === 'dark' ? (
        <>
          <Moon className="size-3" />
          <span>Dark</span>
        </>
      ) : (
        <>
          <Sun className="size-3" />
          <span>Light</span>
        </>
      )}
    </button>
  )
}
