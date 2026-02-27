import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full', {
  variants: {
    variant: {
      default: 'bg-card2 text-text2',
      success: 'bg-success/15 text-success',
      warning: 'bg-warn/30 text-[var(--warn-text)]',
      danger: 'bg-danger/15 text-danger',
      info: 'bg-accent/15 text-accent',
    },
    size: {
      sm: 'px-2 py-0.5 text-[11px] font-semibold',
      lg: 'px-4 py-2 text-xl font-bold leading-none',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'sm',
  },
})

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
