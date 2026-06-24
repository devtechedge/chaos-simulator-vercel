'use client'

import { useState } from 'react'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'
import { PanelShell } from '@/components/ui/panel-shell'

const ANOMALY_TYPES = [
  { value: '500_ERROR' as const, label: 'HTTP 500' },
  { value: 'LATENCY_SPIKE' as const, label: 'Latency Spike' },
  { value: 'SERVICE_CRASH' as const, label: 'Service Crash' },
  { value: 'NETWORK_PARTITION' as const, label: 'Network Partition' },
]

const SERVICE_NAMES = ['AuthService', 'PaymentService', 'InventoryService']

interface Preset {
  name: string
  description: string
  steps: {
    delayMs: number
    service: string
    type: '500_ERROR' | 'LATENCY_SPIKE' | 'SERVICE_CRASH' | 'NETWORK_PARTITION'
  }[]
}

const PRESETS: Preset[] = [
  {
    name: 'Rolling Thunder',
    description: 'Sequential crashes across all services with 5s gaps',
    steps: [
      { delayMs: 0, service: 'AuthService', type: 'SERVICE_CRASH' },
      { delayMs: 5000, service: 'PaymentService', type: 'SERVICE_CRASH' },
      { delayMs: 10000, service: 'InventoryService', type: 'SERVICE_CRASH' },
    ],
  },
  {
    name: 'Latency Cascade',
    description: 'Escalating latency spikes hitting each service in turn',
    steps: [
      { delayMs: 0, service: 'AuthService', type: 'LATENCY_SPIKE' },
      { delayMs: 8000, service: 'PaymentService', type: 'LATENCY_SPIKE' },
      { delayMs: 16000, service: 'InventoryService', type: 'LATENCY_SPIKE' },
    ],
  },
  {
    name: 'Black Friday',
    description: 'Mixed storm: errors + crashes + partitions',
    steps: [
      { delayMs: 0, service: 'PaymentService', type: '500_ERROR' },
      { delayMs: 4000, service: 'InventoryService', type: 'LATENCY_SPIKE' },
      { delayMs: 9000, service: 'AuthService', type: 'NETWORK_PARTITION' },
      { delayMs: 14000, service: 'PaymentService', type: 'SERVICE_CRASH' },
    ],
  },
  {
    name: 'Cascading Failure',
    description: 'Auth fails → payment fails → inventory fails',
    steps: [
      { delayMs: 0, service: 'AuthService', type: '500_ERROR' },
      { delayMs: 3000, service: 'PaymentService', type: 'SERVICE_CRASH' },
      { delayMs: 7000, service: 'InventoryService', type: 'NETWORK_PARTITION' },
    ],
  },
]

export function ChaosScenarioBuilder({
  open,
  onClose,
  onRun,
}: {
  open: boolean
  onClose: () => void
  onRun: (name: string, steps: Preset['steps']) => void
}) {
  const [step, setStep] = useState(0)
  const [scenarioName, setScenarioName] = useState('')
  const [steps, setSteps] = useState<Preset['steps']>([
    { delayMs: 0, service: 'AuthService', type: '500_ERROR' },
  ])

  const applyPreset = (presetIdx: number) => {
    const preset = PRESETS[presetIdx]
    setScenarioName(preset.name)
    setSteps(preset.steps.map((s) => ({ ...s })))
    setStep(1)
  }

  const handleRun = () => {
    onRun(scenarioName || 'Custom Scenario', steps)
  }

  return (
    <PanelShell
      category="Operations"
      title="Chaos Scenario Builder"
      subtitle="Compose multi-step failure cascades"
      caption="Pick a preset, customize the step order, or build from scratch. Each step runs after a configurable delay."
    >
      {/* Stepper */}
      <div className="rule" />
      <div className="flex items-center gap-2 py-4">
        {['Select Template', 'Compose Steps', 'Review & Launch'].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-3">
            <div
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                step >= i
                  ? 'bg-[var(--color-accent)] text-[var(--color-accent-fg)]'
                  : 'bg-[var(--color-surface-2)] text-[var(--color-ink-subtle)]'
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-[11px] uppercase tracking-[0.14em] ${
                step >= i ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink-subtle)]'
              }`}
            >
              {label}
            </span>
            {i < 2 && <span className="ml-2 hidden h-px flex-1 bg-[var(--color-border)] md:block" />}
          </div>
        ))}
      </div>

      {/* STEP 0 — Template selection */}
      {step === 0 && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {PRESETS.map((preset, i) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(i)}
              className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold text-[var(--color-ink)]">{preset.name}</span>
                <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
                  {preset.steps.length} steps
                </span>
              </div>
              <p className="text-[12px] text-[var(--color-ink-subtle)]">{preset.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {preset.steps.map((s, j) => (
                  <span
                    key={j}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-muted)]"
                  >
                    {s.service} · {s.type.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* STEP 1 — Compose steps */}
      {step === 1 && (
        <div className="space-y-3">
          <div>
            <label className="label mb-1.5 block">Scenario name</label>
            <input
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="e.g. Friday Night Special"
              className="h-9 w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-accent)] focus:outline-none"
            />
          </div>

          <div>
            <div className="label mb-2">Steps ({steps.length})</div>
            <div className="space-y-2">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] p-3 md:grid-cols-[40px,100px,1fr,1fr]"
                >
                  <div className="font-mono text-[14px] font-bold text-[var(--color-accent)]">#{i + 1}</div>
                  <input
                    type="number"
                    value={s.delayMs}
                    onChange={(e) => {
                      const v = parseInt(e.target.value) || 0
                      setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, delayMs: v } : x)))
                    }}
                    className="h-8 border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
                  />
                  <select
                    value={s.service}
                    onChange={(e) => {
                      setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, service: e.target.value } : x)))
                    }}
                    className="h-8 border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    {SERVICE_NAMES.map((sn) => (
                      <option key={sn} value={sn}>
                        {sn}
                      </option>
                    ))}
                  </select>
                  <select
                    value={s.type}
                    onChange={(e) => {
                      setSteps((prev) =>
                        prev.map((x, j) => (j === i ? { ...x, type: e.target.value as any } : x)),
                      )
                    }}
                    className="h-8 border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 text-xs text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none"
                  >
                    {ANOMALY_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={() =>
                setSteps((prev) => [
                  ...prev,
                  {
                    delayMs: prev.length > 0 ? prev[prev.length - 1].delayMs + 5000 : 0,
                    service: 'PaymentService',
                    type: 'LATENCY_SPIKE',
                  },
                ])
              }
              className="mt-2 w-full border border-dashed border-[var(--color-border)] py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-subtle)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              + Add step
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 — Review */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <div className="label">Scenario name</div>
            <div className="mt-1 font-display text-[18px] font-medium text-[var(--color-ink)]">
              {scenarioName || 'Custom Scenario'}
            </div>
          </div>
          <div>
            <div className="label mb-2">Execution timeline</div>
            <div className="space-y-1">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[60px,1fr,80px] items-center gap-3 border-b border-[var(--color-border)] py-2 text-[12px]"
                >
                  <span className="font-mono tabular-nums text-[var(--color-accent)]">
                    +{(s.delayMs / 1000).toFixed(1)}s
                  </span>
                  <span className="text-[var(--color-ink)]">{s.service}</span>
                  <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)] text-right">
                    {s.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-ink-subtle)]">
              Total {((steps[steps.length - 1]?.delayMs ?? 0) / 1000).toFixed(1)}s · {steps.length} step
              {steps.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      )}

      <div className="rule mt-6" />
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <button
          onClick={onClose}
          className="border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
        >
          Close
        </button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex items-center gap-1 border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-2)]"
            >
              <ChevronLeft className="size-3" /> Back
            </button>
          )}
          {step < 2 ? (
            <button
              onClick={() => setStep((s) => Math.min(2, s + 1))}
              className="flex items-center gap-1 bg-[var(--color-accent)] px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent-fg)] hover:opacity-90"
            >
              Next <ChevronRight className="size-3" />
            </button>
          ) : (
            <button
              onClick={handleRun}
              className="flex items-center gap-1 bg-[var(--color-accent)] px-4 py-2 text-[11px] uppercase tracking-[0.14em] text-[var(--color-accent-fg)] hover:opacity-90"
            >
              <Play className="size-3" /> Launch scenario
            </button>
          )}
        </div>
      </div>
    </PanelShell>
  )
}
