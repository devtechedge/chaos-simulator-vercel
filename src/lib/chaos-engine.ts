// ============================================================
// CHAOS ENGINE — Next.js / Vercel-compatible module-level singleton
// ============================================================
//
// This replaces the original Bun + Socket.io backend. It runs entirely
// inside a single Next.js process (Vercel serverless function) and uses
// a module-level singleton so the chaos loops stay alive while the
// function instance is warm.
//
// Key constraints for Vercel deployment:
// - No long-lived WebSocket connections (use polling instead)
// - State lives in a module-level singleton (lost on cold start, OK for demo)
// - All timers run as `setInterval` at module scope
// - State is fetched via GET /api/state, mutated via POST /api/command
//
// Trade-off vs original Socket.io build:
// - ~1s polling latency instead of ~50ms push latency
// - On cold start (Vercel scale-to-zero), the simulation restarts
//   from scratch — this is acceptable for a chaos simulator demo.
// ============================================================

// ------------------------------------------------------------
// TYPES & INTERFACES (mirrors the original Bun backend)
// ------------------------------------------------------------

export type HealthStatus = 'Healthy' | 'Degraded' | 'Down'
export type AnomalyType =
  | '500_ERROR'
  | 'LATENCY_SPIKE'
  | 'SERVICE_CRASH'
  | 'NETWORK_PARTITION'

export interface MicroserviceState {
  name: string
  health: HealthStatus
  latencyMs: number
  baselineLatencyMs: number
  requestVolume: number
  outagesPrevented: number
  isCrashed: boolean
  anomaly: AnomalyType | null
  anomalyStartedAt: number | null
}

export interface LogEvent {
  id: string
  timestamp: string
  level: 'INFO' | 'WARN' | 'CRITICAL' | 'RESOLVED'
  service: string
  message: string
}

export interface LatencySample {
  timestamp: number
  latencyMs: number
  baselineLatencyMs: number
}

export interface AnomalyHistoryEntry {
  id: string
  serviceName: string
  type: AnomalyType
  startedAt: number
  resolvedAt: number | null
  recoveryTimeMs: number | null
  triggeredBy: 'auto' | 'manual' | 'scenario'
}

export interface ScenarioStep {
  delayMs: number
  service: string
  type: AnomalyType
}

export interface Scenario {
  id: string
  name: string
  steps: ScenarioStep[]
}

// ------------------------------------------------------------
// SERVICE REGISTRY
// ------------------------------------------------------------

const SERVICES_CONFIG = [
  { name: 'AuthService', baselineLatencyMs: 45, baseRequestVolume: 1200 },
  { name: 'PaymentService', baselineLatencyMs: 78, baseRequestVolume: 850 },
  { name: 'InventoryService', baselineLatencyMs: 32, baseRequestVolume: 2100 },
]

// `globalThis` is used so that Next.js hot-reload during dev doesn't create
// multiple engine instances. In production on Vercel, each cold start
// initializes fresh state — that's the documented behavior.
type ChaosGlobal = typeof globalThis & {
  __chaos_engine__?: {
    services: Map<string, MicroserviceState>
    latencyHistory: Map<string, LatencySample[]>
    anomalyHistory: AnomalyHistoryEntry[]
    eventLog: LogEvent[]
    activeScenarios: Map<string, NodeJS.Timeout[]>
    chaosEnabled: boolean
    startedAt: number
    chaosInterval: NodeJS.Timeout | null
    healerInterval: NodeJS.Timeout | null
    volumeInterval: NodeJS.Timeout | null
    latencyInterval: NodeJS.Timeout | null
  }
}

const g = globalThis as ChaosGlobal

function initEngine() {
  if (g.__chaos_engine__) return g.__chaos_engine__

  const services = new Map<string, MicroserviceState>()
  for (const cfg of SERVICES_CONFIG) {
    services.set(cfg.name, {
      name: cfg.name,
      health: 'Healthy',
      latencyMs: cfg.baselineLatencyMs,
      baselineLatencyMs: cfg.baselineLatencyMs,
      requestVolume: cfg.baseRequestVolume,
      outagesPrevented: 0,
      isCrashed: false,
      anomaly: null,
      anomalyStartedAt: null,
    })
  }

  // Seed latency history with 60 samples per service
  const latencyHistory = new Map<string, LatencySample[]>()
  const now = Date.now()
  for (const cfg of SERVICES_CONFIG) {
    const samples: LatencySample[] = []
    for (let i = 60 - 1; i >= 0; i--) {
      const ts = now - i * 1000
      const jitter = Math.floor(Math.random() * 12 - 6)
      samples.push({
        timestamp: ts,
        latencyMs: Math.max(1, cfg.baselineLatencyMs + jitter),
        baselineLatencyMs: cfg.baselineLatencyMs,
      })
    }
    latencyHistory.set(cfg.name, samples)
  }

  const engine = {
    services,
    latencyHistory,
    anomalyHistory: [] as AnomalyHistoryEntry[],
    eventLog: [] as LogEvent[],
    activeScenarios: new Map<string, NodeJS.Timeout[]>(),
    chaosEnabled: true,
    startedAt: Date.now(),
    chaosInterval: null as NodeJS.Timeout | null,
    healerInterval: null as NodeJS.Timeout | null,
    volumeInterval: null as NodeJS.Timeout | null,
    latencyInterval: null as NodeJS.Timeout | null,
  }

  g.__chaos_engine__ = engine

  // Seed initial log
  _moduleLog('INFO', 'ChaosEngine', 'System initialized. All 3 microservices reporting HEALTHY.')
  _moduleLog(
    'INFO',
    'ChaosEngine',
    'Self-healing recovery worker online. Monitoring service health every 5 seconds.',
  )
  _moduleLog(
    'INFO',
    'ChaosEngine',
    'Chaos Injector Engine armed. First random anomaly in 30 seconds.',
  )

  // Start the loops
  startChaosLoop(engine)
  startHealerLoop(engine)
  startTrafficSimulator(engine)
  startLatencySampler(engine)

  return engine
}

// ------------------------------------------------------------
// LOG EVENT SYSTEM
// ------------------------------------------------------------

const MAX_LOG_ENTRIES = 200

function pushLog(
  engine: ReturnType<typeof initEngine>,
  level: LogEvent['level'],
  service: string,
  message: string,
): LogEvent {
  const now = new Date()
  const entry: LogEvent = {
    id: Math.random().toString(36).slice(2, 11),
    timestamp: now.toLocaleTimeString('en-US', { hour12: false }),
    level,
    service,
    message,
  }
  engine.eventLog.push(entry)
  if (engine.eventLog.length > MAX_LOG_ENTRIES) engine.eventLog.shift()
  return entry
}

// Module-level wrapper for initialization logs (before engine exists)
function _moduleLog(level: LogEvent['level'], service: string, message: string) {
  // Just no-op for now — these seed messages are not critical
  return { id: 'init', timestamp: '', level, service, message }
}

// Convenience wrapper for module-level callers
function log(level: LogEvent['level'], service: string, message: string): LogEvent {
  return pushLog(initEngine(), level, service, message)
}

// ------------------------------------------------------------
// ANOMALY HISTORY
// ------------------------------------------------------------

const MAX_ANOMALY_HISTORY = 200

function pushAnomalyStart(
  engine: ReturnType<typeof initEngine>,
  serviceName: string,
  type: AnomalyType,
  triggeredBy: 'auto' | 'manual' | 'scenario' = 'auto',
): AnomalyHistoryEntry {
  const entry: AnomalyHistoryEntry = {
    id: Math.random().toString(36).slice(2, 11),
    serviceName,
    type,
    startedAt: Date.now(),
    resolvedAt: null,
    recoveryTimeMs: null,
    triggeredBy,
  }
  engine.anomalyHistory.push(entry)
  if (engine.anomalyHistory.length > MAX_ANOMALY_HISTORY) engine.anomalyHistory.shift()
  return entry
}

function markAnomalyResolved(
  engine: ReturnType<typeof initEngine>,
  serviceName: string,
): AnomalyHistoryEntry | null {
  for (let i = engine.anomalyHistory.length - 1; i >= 0; i--) {
    const entry = engine.anomalyHistory[i]
    if (entry.serviceName === serviceName && entry.resolvedAt === null) {
      entry.resolvedAt = Date.now()
      entry.recoveryTimeMs = entry.resolvedAt - entry.startedAt
      return entry
    }
  }
  return null
}

// ------------------------------------------------------------
// LATENCY SAMPLING
// ------------------------------------------------------------

const MAX_LATENCY_SAMPLES = 60

function pushLatencySample(
  engine: ReturnType<typeof initEngine>,
  serviceName: string,
  latencyMs: number,
  baselineLatencyMs: number,
) {
  const arr = engine.latencyHistory.get(serviceName)
  if (!arr) return
  arr.push({ timestamp: Date.now(), latencyMs, baselineLatencyMs })
  if (arr.length > MAX_LATENCY_SAMPLES) arr.shift()
}

function sampleAllLatencies(engine: ReturnType<typeof initEngine>) {
  for (const [name, svc] of engine.services) {
    const baseLatency = svc.isCrashed ? 0 : svc.latencyMs
    const jitter = svc.health === 'Healthy' ? Math.floor(Math.random() * 8 - 4) : 0
    pushLatencySample(engine, name, Math.max(0, baseLatency + jitter), svc.baselineLatencyMs)
  }
}

// ------------------------------------------------------------
// CHAOS INJECTOR
// ------------------------------------------------------------

const ANOMALY_TYPES: AnomalyType[] = ['500_ERROR', 'LATENCY_SPIKE', 'SERVICE_CRASH']
const SERVICE_NAMES = SERVICES_CONFIG.map((s) => s.name)

function injectAnomaly(
  engine: ReturnType<typeof initEngine>,
  serviceName?: string,
  type?: AnomalyType,
  triggeredBy: 'auto' | 'manual' | 'scenario' = 'auto',
) {
  const target = serviceName || SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)]
  const svc = engine.services.get(target)
  if (!svc) return

  if (svc.health !== 'Healthy' && !type) return

  const anomalyType = type || ANOMALY_TYPES[Math.floor(Math.random() * ANOMALY_TYPES.length)]
  svc.anomaly = anomalyType
  svc.anomalyStartedAt = Date.now()

  pushAnomalyStart(engine, target, anomalyType, triggeredBy)

  switch (anomalyType) {
    case '500_ERROR': {
      svc.health = 'Down'
      const errorRate = Math.floor(Math.random() * 60) + 40
      log(
        'CRITICAL',
        target,
        `HTTP 500 Internal Server Error — ${errorRate}% of requests failing. Service marked DOWN.`,
      )
      break
    }
    case 'LATENCY_SPIKE': {
      svc.health = 'Degraded'
      const spikeLatency = Math.floor(Math.random() * 4000) + 2000
      svc.latencyMs = spikeLatency
      log(
        'CRITICAL',
        target,
        `Latency spiked to ${spikeLatency}ms (baseline: ${svc.baselineLatencyMs}ms). Service DEGRADED.`,
      )
      break
    }
    case 'SERVICE_CRASH': {
      svc.health = 'Down'
      svc.isCrashed = true
      svc.latencyMs = 0
      svc.requestVolume = 0
      log('CRITICAL', target, `Service CRASHED — process terminated unexpectedly. All traffic halted.`)
      break
    }
    case 'NETWORK_PARTITION': {
      svc.health = 'Down'
      svc.isCrashed = true
      svc.latencyMs = 0
      svc.requestVolume = 0
      log(
        'CRITICAL',
        target,
        `MASSIVE NETWORK PARTITION — complete connectivity loss. Service unreachable.`,
      )
      break
    }
  }
}

// ------------------------------------------------------------
// SELF-HEALING WORKER
// ------------------------------------------------------------

function runSelfHealingCycle(engine: ReturnType<typeof initEngine>) {
  for (const [name, svc] of engine.services) {
    if (svc.health === 'Healthy') {
      svc.latencyMs = Math.max(
        1,
        svc.baselineLatencyMs + Math.floor(Math.random() * 20 - 10),
      )
      svc.requestVolume = Math.max(
        100,
        svc.requestVolume + Math.floor(Math.random() * 60 - 30),
      )
      continue
    }

    if (
      svc.anomalyStartedAt &&
      Date.now() - svc.anomalyStartedAt >= 8000 + Math.random() * 7000
    ) {
      const prevAnomaly = svc.anomaly
      svc.health = 'Healthy'
      svc.latencyMs = svc.baselineLatencyMs
      svc.isCrashed = false
      svc.requestVolume =
        SERVICES_CONFIG.find((c) => c.name === name)!.baseRequestVolume +
        Math.floor(Math.random() * 200 - 100)
      svc.outagesPrevented += 1
      svc.anomaly = null
      svc.anomalyStartedAt = null

      const recoveryMsg =
        prevAnomaly === 'SERVICE_CRASH'
          ? `Self-healing worker successfully recycled worker pool. Service restarted and healthy.`
          : prevAnomaly === 'NETWORK_PARTITION'
            ? `Self-healing worker re-established network routes. Connectivity restored.`
            : prevAnomaly === '500_ERROR'
              ? `Self-healing worker performed automatic failover. Error rate normalized.`
              : `Self-healing worker scaled resources and restored baseline latency.`

      log('RESOLVED', name, recoveryMsg)
      markAnomalyResolved(engine, name)
    }
  }
}

// ------------------------------------------------------------
// TRAFFIC SIMULATOR
// ------------------------------------------------------------

function simulateTraffic(engine: ReturnType<typeof initEngine>) {
  for (const [, svc] of engine.services) {
    if (svc.health === 'Healthy') {
      svc.requestVolume = Math.max(50, svc.requestVolume + Math.floor(Math.random() * 80 - 40))
    } else if (svc.health === 'Degraded') {
      svc.requestVolume = Math.max(20, svc.requestVolume - Math.floor(Math.random() * 50))
    }
  }
}

// ------------------------------------------------------------
// LOOPS — started lazily on first init
// ------------------------------------------------------------

function startChaosLoop(engine: ReturnType<typeof initEngine>) {
  if (engine.chaosInterval) return
  log(
    'INFO',
    'ChaosEngine',
    `Chaos Injector Engine started — injecting anomalies every 30 seconds.`,
  )
  engine.chaosInterval = setInterval(() => {
    if (!engine.chaosEnabled) return
    injectAnomaly(engine)
  }, 30000)
}

function startHealerLoop(engine: ReturnType<typeof initEngine>) {
  if (engine.healerInterval) return
  engine.healerInterval = setInterval(() => runSelfHealingCycle(engine), 5000)
}

function startTrafficSimulator(engine: ReturnType<typeof initEngine>) {
  if (engine.volumeInterval) return
  engine.volumeInterval = setInterval(() => simulateTraffic(engine), 4000)
}

function startLatencySampler(engine: ReturnType<typeof initEngine>) {
  if (engine.latencyInterval) return
  engine.latencyInterval = setInterval(() => sampleAllLatencies(engine), 1000)
}

// ------------------------------------------------------------
// SCENARIO RUNNER
// ------------------------------------------------------------

function runScenario(engine: ReturnType<typeof initEngine>, scenario: Scenario) {
  const timers: NodeJS.Timeout[] = []
  log(
    'WARN',
    'ChaosEngine',
    `SCENARIO STARTED: "${scenario.name}" — ${scenario.steps.length} step(s) queued.`,
  )

  let stepIndex = 0
  for (const step of scenario.steps) {
    const t = setTimeout(() => {
      stepIndex++
      log(
        'INFO',
        'ChaosEngine',
        `Scenario step ${stepIndex}/${scenario.steps.length}: inject ${step.type} on ${step.service}`,
      )
      injectAnomaly(engine, step.service, step.type, 'scenario')
    }, step.delayMs)
    timers.push(t)
  }

  const totalDuration =
    scenario.steps.reduce((sum, s) => sum + s.delayMs, 0) + 2000
  const completionTimer = setTimeout(() => {
    log(
      'INFO',
      'ChaosEngine',
      `SCENARIO COMPLETE: "${scenario.name}" — all ${scenario.steps.length} step(s) executed.`,
    )
  }, totalDuration)
  timers.push(completionTimer)

  engine.activeScenarios.set(scenario.id, timers)
}

// ------------------------------------------------------------
// PUBLIC API — used by the API route handlers
// ------------------------------------------------------------

export function getEngine() {
  return initEngine()
}

export function getTelemetrySnapshot() {
  const engine = getEngine()
  return Array.from(engine.services.values()).map((s) => ({
    name: s.name,
    health: s.health,
    latencyMs: s.latencyMs,
    baselineLatencyMs: s.baselineLatencyMs,
    requestVolume: s.requestVolume,
    outagesPrevented: s.outagesPrevented,
    isCrashed: s.isCrashed,
    anomaly: s.anomaly,
  }))
}

export function getLatencyHistory() {
  const engine = getEngine()
  return Array.from(engine.latencyHistory.entries()).map(([name, samples]) => ({
    serviceName: name,
    samples,
  }))
}

export function getAnomalyHistory() {
  const engine = getEngine()
  return engine.anomalyHistory
}

export function getRecentLogs(limit = 100) {
  const engine = getEngine()
  return engine.eventLog.slice(-limit)
}

export type Command =
  | { type: 'manual-restart'; service: string }
  | { type: 'trigger-partition' }
  | { type: 'toggle-chaos'; enabled: boolean }
  | { type: 'inject-anomaly'; service: string; anomalyType: AnomalyType }
  | { type: 'run-scenario'; name: string; steps: ScenarioStep[] }
  | { type: 'cancel-scenario'; scenarioId: string }

export function executeCommand(cmd: Command): { ok: boolean; message?: string } {
  const engine = getEngine()

  switch (cmd.type) {
    case 'manual-restart': {
      const svc = engine.services.get(cmd.service)
      if (!svc) return { ok: false, message: `Unknown service: ${cmd.service}` }
      const wasAnomalous = svc.anomaly !== null
      svc.health = 'Healthy'
      svc.latencyMs = svc.baselineLatencyMs
      svc.isCrashed = false
      svc.requestVolume = SERVICES_CONFIG.find((c) => c.name === cmd.service)!.baseRequestVolume
      svc.anomaly = null
      svc.anomalyStartedAt = null
      if (wasAnomalous) markAnomalyResolved(engine, cmd.service)
      log(
        'INFO',
        cmd.service,
        `Manual restart triggered by operator. Service forcefully recycled and restored to HEALTHY.`,
      )
      return { ok: true }
    }

    case 'trigger-partition': {
      log(
        'WARN',
        'ChaosEngine',
        `OPERATOR TRIGGERED: Massive Network Partition — all services affected!`,
      )
      for (const [name] of engine.services) {
        injectAnomaly(engine, name, 'NETWORK_PARTITION', 'manual')
      }
      return { ok: true }
    }

    case 'toggle-chaos': {
      engine.chaosEnabled = cmd.enabled
      log(
        'INFO',
        'ChaosEngine',
        `Chaos Injector Engine ${cmd.enabled ? 'ENABLED' : 'DISABLED'} by operator.`,
      )
      return { ok: true }
    }

    case 'inject-anomaly': {
      injectAnomaly(engine, cmd.service, cmd.anomalyType, 'manual')
      return { ok: true }
    }

    case 'run-scenario': {
      const scenario: Scenario = {
        id: Math.random().toString(36).slice(2, 11),
        name: cmd.name || 'Custom Scenario',
        steps: cmd.steps,
      }
      runScenario(engine, scenario)
      return { ok: true, message: scenario.id }
    }

    case 'cancel-scenario': {
      const timers = engine.activeScenarios.get(cmd.scenarioId)
      if (timers) {
        timers.forEach(clearTimeout)
        engine.activeScenarios.delete(cmd.scenarioId)
        log('WARN', 'ChaosEngine', `Scenario ${cmd.scenarioId} cancelled by operator.`)
      }
      return { ok: true }
    }
  }
}

export function getFullSnapshot() {
  return {
    services: getTelemetrySnapshot(),
    logs: getRecentLogs(100),
    latency: getLatencyHistory(),
    anomalies: getAnomalyHistory(),
    chaosEnabled: getEngine().chaosEnabled,
    timestamp: Date.now(),
    uptimeMs: Date.now() - getEngine().startedAt,
  }
}

// ============================================================
// OVERVIEW — derived metrics for the editorial dashboard hero
// ============================================================
export function getOverview() {
  const engine = getEngine()
  const services = Array.from(engine.services.values())
  const healthyCount = services.filter((s) => s.health === 'Healthy').length
  const totalAnomalies = engine.anomalyHistory.length
  const resolvedAnomalies = engine.anomalyHistory.filter((a) => a.resolvedAt !== null).length
  const activeAnomalies = totalAnomalies - resolvedAnomalies
  const avgLatencyMs =
    services.length > 0
      ? services.reduce((s, x) => s + (x.isCrashed ? 0 : x.latencyMs), 0) / services.length
      : 0
  const maxLatencyMs =
    services.length > 0
      ? Math.max(...services.map((x) => (x.isCrashed ? 0 : x.latencyMs)))
      : 0
  const totalOutagesPrevented = services.reduce((s, x) => s + x.outagesPrevented, 0)
  const limitedStockCount = services.filter((s) => (s as any).stockLevel !== undefined && (s as any).stockLevel < 30).length
  const chaosCycles = engine.anomalyHistory.length
  return {
    activeServices: healthyCount,
    outagesPrevented: totalOutagesPrevented,
    chaosCycles,
    avgLatencyMs,
    maxLatencyMs,
    totalAnomalies,
    resolvedAnomalies,
    activeAnomalies,
    limitedStockCount,
    avgDisparity: 13.08,
    maxDisparity: 38.0,
    avgHypeScore: 67,
    serviceLatency: services.map((s) => ({
      service: s.name,
      latencyMs: Math.round(s.latencyMs),
    })),
  }
}
