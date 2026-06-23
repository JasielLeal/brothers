'use client'

import { NumericFormat } from 'react-number-format'
import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

interface CurrencyInputProps extends Omit<
  ComponentPropsWithoutRef<'input'>,
  'onChange' | 'value' | 'defaultValue'
> {
  value?: number | string | null
  onValueChange?: (value: number | undefined) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    return (
      <NumericFormat
        getInputRef={ref}
        value={value ?? ''}
        thousandSeparator="."
        decimalSeparator=","
        decimalScale={2}
        fixedDecimalScale
        prefix="R$ "
        allowNegative={false}
        onValueChange={(vals) => {
          onValueChange?.(vals.floatValue)
        }}
        className={
          className ??
          'placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-1 text-sm transition-colors focus-visible:border-[#4A6CF7] focus-visible:bg-white focus-visible:ring-1 focus-visible:outline-none'
        }
        {...(props as object)}
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
