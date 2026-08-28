import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "ui-button relative inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2 active:scale-[.98] disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-blue-700 text-white shadow-md shadow-blue-900/15 hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-lg hover:shadow-blue-900/20",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:-translate-y-0.5 hover:border-blue-400/50 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, loading = false, loadingText, children, disabled, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={!asChild ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      {...props}>
      {loading && !asChild ? (
        <>
          <span className="ui-button-spinner" aria-hidden="true" />
          <span className="inline-flex translate-y-1 items-center justify-center gap-2 opacity-0">{children}</span>
          <span className="sr-only">{loadingText || 'Loading'}</span>
        </>
      ) : children}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
