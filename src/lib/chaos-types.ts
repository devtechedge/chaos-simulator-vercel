// ============================================================
// SHARED TYPES — used by both the chaos engine and the frontend
// ============================================================

export type HealthStatus = 'Healthy' | 'Degraded' | 'Down'
export type AnomalyType =
  | '500_ERROR'
  | 'LATENCY_SPIKE'
  | 'SERVICE_CRASH'
  | 'NETWORK_PARTITION'

export type LogLevel = 'INFO' | 'WARN' | 'CRITICAL' | 'RESOLVED'

export interface ServiceData {
  name: string
  health: HealthStatus
  latencyMs: number
  baselineLatencyMs: number
  requestVolume: number
  outagesPrevented: number
  isCrashed: boolean
  anomaly: AnomalyType | null
}

export interface LogEvent {
  id: string
  timestamp: string
  level: LogLevel
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

// ------------------------------------------------------------
// Static metadata for the 3 services (visual configuration)
// ------------------------------------------------------------

export const SERVICE_NAMES = ['AuthService', 'PaymentService', 'InventoryService'] as const
export type ServiceName = (typeof SERVICE_NAMES)[number]

export const SERVICE_META: Record<
  ServiceName,
  { icon: string; description: string; accent: string; color: string; shortName: string }
> = {
  AuthService: {
    icon: 'Shield',
    description: 'OAuth/JWT token validation, session management',
    accent: '#f97316',
    color: '#f97316',
    shortName: 'AUTH',
  },
  PaymentService: {
    icon: 'Zap',
    description: 'Stripe integration, transaction processing',
    accent: '#10b981',
    color: '#10b981',
    shortName: 'PAY',
  },
  InventoryService: {
    icon: 'Server',
    description: 'Stock levels, catalog queries, reservations',
    accent: '#f59e0b',
    color: '#f59e0b',
    shortName: 'INV',
  },
}

export const ANOMALY_COLORS: Record<AnomalyType, string> = {
  '500_ERROR': '#ef4444',
  LATENCY_SPIKE: '#f59e0b',
  SERVICE_CRASH: '#ef4444',
  NETWORK_PARTITION: '#a855f7',
}

export const ANOMALY_LABELS: Record<AnomalyType, string> = {
  '500_ERROR': 'HTTP 500 Error',
  LATENCY_SPIKE: 'Latency Spike',
  SERVICE_CRASH: 'Service Crash',
  NETWORK_PARTITION: 'Network Partition',
}

// Pre-defined scenario presets — used by ChaosScenarioBuilder
export interface ScenarioPreset {
  id: string
  name: string
  description: string
  icon: string
  steps: ScenarioStep[]
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'rolling-thunder',
    name: 'Rolling Thunder',
    description: 'Sequential 500 errors across all services',
    icon: '⚡',
    steps: [
      { delayMs: 0, service: 'AuthService', type: '500_ERROR' },
      { delayMs: 5000, service: 'PaymentService', type: '500_ERROR' },
      { delayMs: 10000, service: 'InventoryService', type: '500_ERROR' },
    ],
  },
  {
    id: 'latency-cascade',
    name: 'Latency Cascade',
    description: 'Cascading latency spikes on a hot path',
    icon: '🐢',
    steps: [
      { delayMs: 0, service: 'AuthService', type: 'LATENCY_SPIKE' },
      { delayMs: 4000, service: 'PaymentService', type: 'LATENCY_SPIKE' },
    ],
  },
  {
    id: 'black-friday',
    name: 'Black Friday',
    description: 'Mixed stress: latency → crash → recovery',
    icon: '🛒',
    steps: [
      { delayMs: 0, service: 'InventoryService', type: 'LATENCY_SPIKE' },
      { delayMs: 6000, service: 'PaymentService', type: 'SERVICE_CRASH' },
      { delayMs: 14000, service: 'AuthService', type: '500_ERROR' },
      { delayMs: 20000, service: 'PaymentService', type: '500_ERROR' },
    ],
  },
  {
    id: 'cascading-failure',
    name: 'Cascading Failure',
    description: 'Total network partition across the fleet',
    icon: '🌐',
    steps: [
      { delayMs: 0, service: 'AuthService', type: 'NETWORK_PARTITION' },
      { delayMs: 3000, service: 'PaymentService', type: 'NETWORK_PARTITION' },
      { delayMs: 6000, service: 'InventoryService', type: 'NETWORK_PARTITION' },
    ],
  },
]
