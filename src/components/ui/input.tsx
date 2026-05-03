import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-12 w-full rounded-[5px] border-0 bg-gray-50/80 px-4 py-3 text-sm sm:text-base font-medium shadow-premium transition-all duration-300 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-primary/10 focus-visible:shadow-premium-lg disabled:cursor-not-allowed disabled:opacity-50 hover:bg-white hover:shadow-premium-lg',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
