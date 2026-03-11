import * as React from "react"

import { cn } from "@/lib/utils"

const alertVariants = {
  default: "border-border text-foreground",
  destructive: "border-red-500/50 text-red-600 bg-red-50",
}

const Alert = React.forwardRef(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative w-full rounded-lg border p-4 text-sm",
      alertVariants[variant] || alertVariants.default,
      className
    )}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm [&_p]:leading-relaxed", className)} {...props} />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertDescription }
