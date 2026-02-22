import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold', {
  variants: {
    variant: {
      default: 'bg-white/10 text-text',
      success: 'bg-green-500/20 text-green-300',
      warning: 'bg-warn/20 text-warn',
      danger: 'bg-red-500/20 text-red-300',
      info: 'bg-accent2/20 text-accent2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
