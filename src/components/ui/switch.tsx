import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Switch({
  className,
  size = 'default',
  checkedIcon,
  uncheckedIcon,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'sm' | 'default'
  /** Switch 开启时 Thumb 内显示的图标 */
  checkedIcon?: React.ReactNode
  /** Switch 关闭时 Thumb 内显示的图标 */
  uncheckedIcon?: React.ReactNode
}) {
  const hasIcon = checkedIcon || uncheckedIcon
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        'peer group/switch border-border focus-visible:ring-ring/50 inline-flex shrink-0 cursor-pointer items-center rounded-full border bg-transparent px-[2px] shadow-xs transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
        !hasIcon &&
          'data-[size=default]:h-[1.15rem] data-[size=default]:w-8 data-[size=sm]:h-3.5 data-[size=sm]:w-6',
        hasIcon &&
          'data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none flex items-center justify-center rounded-full ring-0 transition-transform',
          'bg-(--fg-secondary) data-[state=checked]:bg-(--fg-secondary)',
          !hasIcon && 'group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3',
          hasIcon && 'group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4',
          'data-[state=checked]:translate-x-full data-[state=unchecked]:translate-x-0'
        )}
      >
        {hasIcon && (
          <>
            <span className="hidden group-data-[state=checked]/switch:flex [&>svg]:size-3">
              {checkedIcon}
            </span>
            <span className="flex group-data-[state=checked]/switch:hidden [&>svg]:size-3">
              {uncheckedIcon}
            </span>
          </>
        )}
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
