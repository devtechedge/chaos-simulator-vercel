'use client'
import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg)]/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-2xl">
        {children}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-3 top-3 text-[var(--color-ink-subtle)] hover:text-[var(--color-ink)]"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

export { Dialog }
