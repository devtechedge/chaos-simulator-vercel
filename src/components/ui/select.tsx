'use client'
import * as React from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectContextValue {
  value: string
  onValueChange: (v: string) => void
  open: boolean
  setOpen: (o: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

function useSelect() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error('Select components must be used within <Select>')
  return ctx
}

interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (v: string) => void
  children: React.ReactNode
}

function Select({ value, defaultValue, onValueChange, children }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? '')
  const [open, setOpen] = React.useState(false)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal
  const handleChange = (v: string) => {
    if (!isControlled) setInternal(v)
    onValueChange?.(v)
    setOpen(false)
  }
  return (
    <SelectContext.Provider value={{ value: current, onValueChange: handleChange, open, setOpen }}>
      {children}
    </SelectContext.Provider>
  )
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = useSelect()
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => ctx.setOpen(!ctx.open)}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 opacity-50" />
      </button>
    )
  },
)
SelectTrigger.displayName = 'SelectTrigger'

function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useSelect()
  return <span className={cn(!ctx.value && 'text-[var(--color-ink-faint)]')}>{ctx.value || placeholder}</span>
}

function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useSelect()
  if (!ctx.open) return null
  return (
    <div className={cn('absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl', className)}>
      <div className="max-h-60 overflow-y-auto p-1">{children}</div>
    </div>
  )
}

function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = useSelect()
  const isSelected = ctx.value === value
  return (
    <div
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-[var(--color-surface-2)] text-[var(--color-ink)]',
        isSelected && 'bg-[var(--color-surface-2)] text-[var(--color-ink)]',
      )}
    >
      {children}
      {isSelected && <Check className="ml-auto size-3.5 opacity-70" />}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
