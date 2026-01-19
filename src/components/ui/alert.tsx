import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva(
  'relative w-full overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-4 text-foreground shadow-sm backdrop-blur-md transition-all [&>svg+div]:translate-y-[-2px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground/40 [&>svg~*]:pl-7 [&>*]:relative [&>*]:z-10',
  {
    variants: {
      variant: {
        default:
          'before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-foreground/10 after:absolute after:right-4 after:top-4 after:h-1.5 after:w-1.5 after:rounded-full after:bg-foreground/25',
        destructive:
          'border-destructive/25 bg-destructive/5 text-destructive/80 [&>svg]:text-destructive/60 before:absolute before:left-0 before:top-0 before:h-full before:w-[2px] before:bg-destructive/30 after:absolute after:right-4 after:top-4 after:h-1.5 after:w-1.5 after:rounded-full after:bg-destructive/40',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

const Alert = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  ),
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 text-xs font-semibold opacity-70 tracking-wide', className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-sm leading-relaxed text-current opacity-90', className)} {...props} />
  ),
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription }
