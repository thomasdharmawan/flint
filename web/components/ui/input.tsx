import * as React from "react"

import { cn } from "@/lib/utils"

interface InputProps extends React.ComponentProps<"input"> {
  error?: boolean
  success?: boolean
}

function Input({ className, type, error, success, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      data-error={error}
      data-success={success}
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:shadow-sm",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "hover:border-input/80",
        // Enhanced states
        "data-[error=true]:border-destructive data-[error=true]:ring-destructive/20 dark:data-[error=true]:ring-destructive/40",
        "data-[success=true]:border-emerald-500 data-[success=true]:ring-emerald-500/20 dark:data-[success=true]:ring-emerald-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }