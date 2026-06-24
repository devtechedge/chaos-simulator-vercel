'use client'
import * as React from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  onValueChange: (v: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

function useTabs() {
  const ctx = React.useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
}

function Tabs({ value, defaultValue, onValueChange, children }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '')
  const isControlled = value !== undefined
  const current = isControlled ? value : internal
  const handleChange = (v: string) => {
    if (!isControlled) setInternal(v)
    onValueChange?.(v)
  }
  return (
    <TabsContext.Provider value={{ value: current, onValueChange: handleChange }}>
      <div>{children}</div>
    </TabsContext.Provider>
  )
}

function TabsList({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('inline-flex h-9 items-center gap-1 border border-[var(--color-border)] bg-[var(--color-surface)] p-1 text-[var(--color-ink-muted)]', className)}>
      {children}
    </div>
  )
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const ctx = useTabs()
    const isActive = ctx.value === value
    return (
      <button
        ref={ref}
        onClick={() => ctx.onValueChange(value)}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded px-3 py-1 text-[11px] uppercase tracking-[0.14em] transition-all',
          isActive ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent)]' : 'hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]',
          className,
        )}
        data-state={isActive ? 'active' : 'inactive'}
        {...props}
      >
        {children}
      </button>
    )
  },
)
TabsTrigger.displayName = 'TabsTrigger'

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}
function TabsContent({ className, value, children }: TabsContentProps) {
  const ctx = useTabs()
  if (ctx.value !== value) return null
  return <div className={cn('mt-3', className)}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
