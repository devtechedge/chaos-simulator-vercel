# 🜄 Chaos Simulator — Vercel-Only Build

A real-time chaos engineering simulator with self-healing microservices, animated SVG topology, particle effects, and a multi-step scenario builder. **5 brands, 25 products, 11k+ price history rows, 6 panels, fully Vercel-only — no backend.**

![Next.js 15](https://img.shields.io/badge/Next.js-15-black) ![Vercel](https://img.shields.io/badge/Vercel-ready-black) ![Tailwind 4](https://img.shields.io/badge/Tailwind-4-06b6d4) ![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178c6)

---

## Architecture

```
Single Vercel deployment
└── Next.js 15 app
    ├── src/lib/chaos-engine.ts   # chaos singleton (in-memory, deterministic)
    ├── src/lib/chaos-types.ts    # type definitions
    ├── src/lib/theme.ts          # dark/light mode hook + localStorage
    ├── src/lib/utils.ts
    └── src/components/
        ├── ui/                   # card, badge, button, input, etc. — all theme-aware
        └── chaos/                # 10 chaos components
            ├── TelemetryOverview.tsx
            ├── ServiceTopology.tsx
            ├── LatencyChart.tsx
            ├── AnomalyTimeline.tsx
            ├── ChaosScenarioBuilder.tsx
            ├── LiveLog.tsx
            ├── ServiceCard.tsx
            ├── ConnectionIndicator.tsx
            ├── ToastStack.tsx
            └── ParticleOverlay.tsx
```

**Removed from original:** `mini-services/`, `prisma/`, `Dockerfile`, `docker-compose.yml`, `Caddyfile`, `bun.lock`, API routes. All replaced by `chaos-engine.ts` running as a module-level singleton.

---

## v3.1 — Changelog (editorial redesign)

### #1 · Premium dark/light theme system
- Added `src/lib/theme.ts` — `useTheme()` hook with localStorage persistence + OS preference fallback
- Added inline no-FOUC bootstrap script in `<head>` (sets `data-theme` before React hydrates)
- Two complete CSS variable palettes: **dark** (deep neutral `#0B0B0D`) and **light** (warm paper `#FAFAF7`)
- Single accent color: orange `#F97316` (dark) / `#EA580C` (light) — restrained, used sparingly

### #2 · Editorial typography stack
- **Display**: `"New York", "Iowan Old Style", Charter, Georgia, ui-serif, serif`
- **Body**: `ui-sans-serif, system-ui, sans-serif`
- **Mono**: `"SF Mono", "JetBrains Mono", ui-monospace, monospace` with `font-variant-numeric: tabular-nums` on every numeric column
- Labels use `letter-spacing: 0.14em` small-caps for editorial FT.com feel
- Massive `hero-num` for KPI hero figures

### #3 · All UI primitives rewritten
Updated `Card`, `Button`, `Badge`, `Input`, `Select`, `Separator`, `Tabs`, `Progress`, `Dialog` to use `var(--color-*)` instead of hardcoded Tailwind dark classes. **Zero hardcoded dark colors in compiled HTML.**

### #4 · Sidebar + page shell
- New sidebar: typographic nav with category labels in small caps, single accent dot on active item
- Sticky top bar with breadcrumb + theme toggle pill
- Editorial panel transitions via CSS `@keyframes fade-in` (400ms ease) — **replaces framer-motion** (React 19 incompatible)

### #5 · New `PanelShell` component
- Reusable editorial wrapper used by all 6 panels
- `Section`, `DataRow`, `KpiStrip`, `ChartTooltip`, `EmptyState` helpers

### #6 · All 10 chaos components redesigned
- `TelemetryOverview` — editorial hero with massive `hero-num text-[80px]` + 8-column KPI strip + 2 chart panels
- `ServiceTopology` — SVG with theme-aware colors (`var(--color-accent)`, `var(--color-positive)`, etc.)
- `LatencyChart` — Recharts line chart + service selector chips + 3-column summary grid
- `AnomalyTimeline` — filterable timeline with service + resolved-only filters
- `ChaosScenarioBuilder` — 3-step wizard with template/compose/review steps
- `LiveLog` — terminal-style log with level filter chips
- `ServiceCard` — health-aware card with injection buttons
- `ConnectionIndicator` — status dot + label
- `ToastStack` + `ParticleOverlay` — preserved from original, theme-aware

### #7 · Build version stamp
- `<meta name="build-version" content="v3.1-..." />` in `<head>`
- Forces Vercel CDN cache invalidation on every deploy
- Lets you verify in DevTools (View Source → search "build-version")

### #8 · Tailwind v4 CSS-first config
- Migrated from `@tailwind base/components/utilities` → `@import "tailwindcss"`
- Added `@source "../**/*.{ts,tsx,js,jsx,mdx}"` directive
- Added `@theme` block with all custom CSS variables
- Removed `tailwindcss-animate` (built-in to v4)

### #9 · Removed unused infrastructure
- `framer-motion` dep (React 19 incompat) → CSS animations
- `mini-services/` (Bun backend) → in-memory data
- `prisma/` + `supabase/` → no DB
- `src/app/api/` routes → unused (data is now in-memory)
- `Dockerfile`, `docker-compose.yml`, `Caddyfile` → not needed for Vercel

---

## Panels

| Panel | Path | Description |
|---|---|---|
| Overview | `/` | Editorial hero with KPI strip + 2 charts |
| Service Topology | `/` (Topology tab) | Live SVG mesh with particle data flow |
| Latency Chart | `/` (Latency tab) | 60s rolling latency per service |
| Anomaly Timeline | `/` (Anomaly tab) | Filterable history with recovery stats |
| Chaos Scenarios | `/` (Scenarios tab) | 3-step wizard for multi-step failures |
| Live Log | `/` (Log tab) | Real-time event stream with filters |

---

## Dataset (deterministic)

Generated at module load via seeded PRNG (mulberry32, seed `0xc0ffee`):

| Entity | Count |
|---|---|
| Brands | 5 (Prada, Gucci, Balenciaga, LV, Versace) |
| Products | 25 (5 categories × 5 brands) |
| Regional prices | 125 (× 5 regions) |
| Price history rows | **11,375** (91 days × 25 × 5) |
| Launches | 125 |
| Anomalies | 173 |
| Micro-services | 3 (AuthService, PaymentService, InventoryService) |

---

## Deploy

```bash
# Local
bun install && bun run dev    # → http://localhost:3000

# Vercel
vercel --prod                  # zero env vars, zero config
```

---

## Tech stack

`next@15.1.0` · `react@19` · `typescript@5` · `tailwindcss@4` (`@tailwindcss/postcss`) · `recharts@2.15.4` · `lucide-react@0.525.0` · `class-variance-authority` · `clsx` · `tailwind-merge`

**Removed:** `framer-motion` (React 19 incompat — replaced with CSS), `tailwindcss-animate` (built-in to v4)

---

## Caveats

- **No real backend** — chaos loop runs as `setInterval` in module singleton, resets on cold start
- **No persistence** — anomaly history is in-memory only (resets on cold start)
- **No multi-user** — single-user demo

---

## Original repo

[devtechedge/chaos-simulator](https://github.com/devtechedge/chaos-simulator) — Next.js + Bun + Socket.io + Prisma. This build is a complete removal of all DB/backend infrastructure.

## License

MIT
