import * as React from "react"
import { cn } from "@/lib/utils"

const PopoverContext = React.createContext({ open: false, setOpen: () => {} })

const Popover = ({ children, open, onOpenChange }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen: onOpenChange || setInternalOpen }}>
      {children}
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef(({ children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)

  if (asChild) {
    return React.cloneElement(children, {
      ref,
      onClick: () => setOpen(!open),
      ...props,
    })
  }

  return (
    <button
      ref={ref}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef(({ className, align = "end", ...props }, ref) => {
  const { open } = React.useContext(PopoverContext)
  const contentRef = React.useRef(null)

  if (!open) return null

  const alignClass = {
    start: "left-0",
    center: "left-1/2 -translate-x-1/2",
    end: "right-0",
  }[align]

  return (
    <>
      <div className="fixed inset-0 z-40" />
      <div
        ref={ref}
        className={cn(
          "absolute top-full mt-2 z-50 rounded-md border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-950 animate-in fade-in-0 zoom-in-95",
          alignClass,
          className
        )}
        {...props}
      />
    </>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }
