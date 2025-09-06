import * as React from "react"

import { cn } from "@/lib/utils"

interface TextareaProps extends React.ComponentProps<"textarea"> {
  error?: boolean
  success?: boolean
}

function Textarea({ className, error, success, ...props }: TextareaProps) {
  return (
    <textarea
      data-slot="textarea"
      data-error={error}
      data-success={success}
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // Enhanced states
        "data-[error=true]:border-destructive data-[error=true]:ring-destructive/20 dark:data-[error=true]:ring-destructive/40",
        "data-[success=true]:border-emerald-500 data-[success=true]:ring-emerald-500/20 dark:data-[success=true]:ring-emerald-500/40",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }