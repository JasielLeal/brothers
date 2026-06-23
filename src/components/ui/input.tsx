import * as React from 'react'
import { cn } from '@/utils/cn'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-1 text-base transition-colors file:text-sm file:font-medium hover:border-gray-300 focus-visible:border-[#4A6CF7] focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-white/10 dark:hover:border-white/20',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
