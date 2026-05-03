import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:active:scale-100 relative",
  {
    variants: {
      variant: {
        default:
          'rounded-[5px] bg-primary text-primary-foreground shadow-3d hover:shadow-3d-lg active:shadow-sm before:absolute before:inset-0 before:rounded-[5px] before:bg-gradient-to-b before:from-white/10 before:to-transparent before:pointer-events-none',
        destructive:
          'rounded-[5px] bg-destructive text-white shadow-3d hover:shadow-3d-lg active:shadow-sm',
        outline:
          'rounded-[5px] border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-3d',
        secondary:
          'rounded-[5px] bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-3d',
        ghost: 'rounded-[5px] hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline shadow-none active:scale-100',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
