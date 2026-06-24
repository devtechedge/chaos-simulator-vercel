# 🜄 Chaos Simulator — Distributed Microservices Telemetry Dashboard

A real-time chaos engineering simulator with self-healing microservices, animated SVG topology, particle effects, sound, and a multi-step scenario builder.

**Runs entirely in the browser. No backend, no WebSocket server, no database needed.**

![next](https://img.shields.io/badge/Next.js-16-black) ![tailwind](https://img.shields.io/badge/Tailwind-4-06b6d4) ![static](https://img.shields.io/badge/Static_Export-100%25_Client_Side-orange) ![vercel](https://img.shields.io/badge/Deploy-Vercel_/_GitHub_Pages-brightgreen)

---

## What changed from the original?

The original version required **two hosts**: a Next.js frontend on Vercel + a separate Bun/Socket.io backend on Render or Railway. This was because the chaos simulation engine ran as a long-running server process.

**This version eliminates the backend entirely.** The entire chaos engine (728 lines of simulation logic) has been rewritten as a React hook (`useChaosEngine.ts`) that runs in the browser using `setInterval`. The result:

- No Socket.io, no Bun, no WebSocket server
- No Supabase, no Render, no Railway, no Fly.io
- No environment variables to configure
- No CORS issues, no proxy rewrites
- Deploys as a **static site** to **Vercel** or **GitHub Pages** with zero config
- Every feature from the original is preserved 100%

---

## ✨ Features

### Core simulation
- 3 mock microservices: `AuthService`, `PaymentService`, `InventoryService`
- Automated Chaos Injector (30s loop): `500_ERROR`, `LATENCY_SPIKE`, `SERVICE_CRASH`
- Self-Healing Recovery Worker (recovers within 8–15s)
- Per-service 500/Latency/Crash injection + Massive Network Partition
- KPI strip (active services, outages prevented, chaos cycles, avg latency)

### Animated UI
- **Framer Motion** transitions everywhere (layout, hover, AnimatePresence on log entries)
- **Animated SVG service topology** — gateway + 3 services with live particle data flow along edges, pulse rings on degraded/down nodes
- **Canvas particle burst overlay** — colored particles + shockwaves on every CRITICAL event
- Drifting background glow blobs + animated grid

### Interactive features
1. **Real-time multi-line latency chart** (Recharts, 60s window)
2. **Animated SVG service topology** with particle flow + health-based pulse rings
3. **Chaos Scenario Builder wizard** — 3-step dialog with 4 presets (Rolling Thunder, Latency Cascade, Black Friday, Cascading Failure) + custom composer + live progress banner
4. **Anomaly History Timeline** — filterable by service, stats summary, triggered-by badges (auto/manual/scenario)
5. **Sound + Toast notification system** — Web Audio API synthesized tones (no audio files needed), animated toast stack with progress bars

---

## 📁 Project structure

```
chaos-simulator/
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (dark mode)
│   │   ├── page.tsx                  # Main dashboard — uses useChaosEngine hook
│   │   └── globals.css              # Tailwind + custom animations
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   └── chaos/                    # Custom dashboard components
│   │       ├── ParticleOverlay.tsx
│   │       ├── ServiceTopology.tsx
│   │       ├── LatencyChart.tsx
│   │       ├── ServiceCard.tsx
│   │       ├── LiveLog.tsx
│   │       ├── ChaosScenarioBuilder.tsx
│   │       ├── AnomalyTimeline.tsx
│   │       ├── ToastStack.tsx
│   │       └── ConnectionIndicator.tsx
│   ├── hooks/
│   │   ├── useChaosEngine.ts         # ⭐ ALL simulation logic lives here (client-side)
│   │   ├── use-toast.ts
│   │   └── use-mobile.ts
│   └── lib/
│       ├── chaos-types.ts            # Shared types + service metadata
│       ├── sound-manager.ts          # Web Audio API sound engine
│       └── utils.ts                  # cn() helper
├── public/
│   ├── logo.svg
│   └── robots.txt
├── package.json
├── next.config.ts                    # output: "export" for static hosting
├── tailwind.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
└── components.json                   # shadcn/ui config
```

---

## 🚀 Quick start (local dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000** — the simulation starts immediately. No backend to run.

### 3. Build for production (static export)

```bash
npm run build
```

This generates an `out/` folder with plain HTML/JS/CSS (~1.9MB total). Deploy it anywhere.

---

## 🌐 Deploy

### Option 1: Vercel (easiest)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → sign in with GitHub
3. **Add New** → **Project** → import the repo
4. Leave all settings default → **Deploy**
5. Done. You get a URL like `chaos-simulator-xxx.vercel.app`

No environment variables. No build command changes. Zero config.

### Option 2: GitHub Pages (free)

1. Push this repo to GitHub
2. Go to **Settings → Pages → Source → GitHub Actions**
3. Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: out
      - uses: actions/deploy-pages@v4
```

4. Push the workflow file — GitHub will build and deploy automatically
5. Your site will be live at `https://YOUR_USERNAME.github.io/chaos-simulator/`

### Option 3: Any static host

The `out/` folder from `npm run build` works on **Netlify, Cloudflare Pages, S3, or any web server**. Just point it at the `out/` directory.

---

## 🛠 Tech stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (static export) |
| Language | TypeScript 5 |
| Simulation | Client-side React hook (`useChaosEngine`) |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Theme | next-themes (dark/light mode) |
| Animations | Framer Motion 12 |
| Charts | Recharts 2 |
| Icons | Lucide React |
| Sound | Web Audio API (no audio files) |
| Design | CSS custom properties + glassmorphism |
| Hosting | Vercel / GitHub Pages / any static host |

---

## 🎨 Visual Design

### Architecture
- **Design tokens**: Full CSS custom property system with `:root` (light) and `.dark` (dark) selectors
- **Glassmorphism**: Header, KPI strip, and footer use `backdrop-blur-xl` with translucent backgrounds and subtle borders
- **Surface system**: Three elevation levels (`background`, `card`/`secondary`, `accent`) for consistent depth hierarchy
- **Theme toggle**: Sun/Moon button in the header switches between dark and light modes, persisted via `next-themes`
- **Typography**: Geist Sans (headings/body) + Geist Mono (data values), `tabular-nums` on all numeric displays

### Design system classes
| Class | Purpose |
|---|---|
| `surface-card` | Standard card with background, border, shadow |
| `glass-panel` | Glassmorphism panel with blur + translucent bg |
| `glass-panel-elevated` | Elevated glass with stronger blur |
| `stat-cell` | Consistent metric display cell |
| `text-gradient-chaos` | Orange-to-red gradient text |
| `glow-ring:hover` | Orange glow ring on hover |

### Color palette
- **Orange** `#f97316` — primary accent, chaos engine
- **Emerald** `#10b981` — healthy services, recovery
- **Amber** `#f59e0b` — degraded services, warnings
- **Red** `#ef4444` — down services, critical alerts
- **Dark bg**: `#080b12` (base) / `#0f1420` (cards)
- **Light bg**: `#f8fafc` (base) / `#ffffff` (cards)

---

## 🧪 Testing the features

Once running, try these:

1. **Wait 30 seconds** — the chaos engine will auto-inject a random anomaly. Watch the topology pulse, the particle burst, the toast notification, and the latency chart spike.

2. **Open the Scenario Builder** (top-right button) → pick "Black Friday" → Launch. Watch the header banner show live progress as 4 anomalies fire in sequence.

3. **Toggle sound on** (Volume icon top-right) before triggering a partition — the synthesized alarm + particle burst combo is the most dramatic moment.

4. **Filter the Anomaly Timeline** by service or "resolved only" to see historical patterns.

5. **Click "Crash" on any service** in the Targeted Chaos Injection panel — watch it go DOWN, then self-heal within ~15 seconds.

---

## 📄 License

MIT — do whatever you want with it.