import * as React from 'react'

import { cn } from '@/lib/utils'

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  value: number
  min: number
  max: number
  step?: number
  onValueChange: (value: number) => void
}

export function Slider({ className, value, min, max, step = 1, onValueChange, ...props }: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(event) => onValueChange(Number(event.target.value))}
      className={cn('h-2 w-full cursor-pointer appearance-none rounded-full bg-border/60 accent-accent', className)}
      {...props}
    />
  )
}
