import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] text-[var(--color-accent)]',
        secondary:
          'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-ink-muted)]',
        destructive:
          'border-[var(--color-negative)]/30 bg-[var(--color-negative-soft)] text-[var(--color-negative)]',
        outline:
          'border-[var(--color-border-strong)] text-[var(--color-ink)]',
        success:
          'border-[var(--color-positive)]/30 bg-[var(--color-positive-soft)] text-[var(--color-positive)]',
        warning:
          'border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
