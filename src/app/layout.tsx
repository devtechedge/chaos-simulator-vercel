import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Chaos Simulator — Distributed Microservices Telemetry',
  description:
    'Real-time chaos engineering simulator with self-healing microservices, animated SVG topology, particle effects, sound, and a multi-step scenario builder.',
  other: {
    'build-version': 'v3.1-202606240208',
  },
}

// Inline bootstrap that runs BEFORE React hydrates, applies saved theme
// to <html data-theme="..."> so there's no flash on first paint.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('chaos-simulator:theme');
    if (t !== 'dark' && t !== 'light') {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();
`.trim()

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] antialiased"
        style={{
          fontFamily: 'var(--font-sans)',
          fontFeatureSettings: '"ss01", "cv11"',
        }}
      >
        {children}
      </body>
    </html>
  )
}
