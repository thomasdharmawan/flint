import { Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  title?: string
  description?: string
  variant?: "default" | "compact"
  className?: string
}

export function LoadingState({ 
  title = "Loading...", 
  description, 
  variant = "default",
  className 
}: LoadingStateProps) {
  return (
    <div className={cn(
      "flex items-center justify-center",
      variant === "default" ? "min-h-[400px]" : "min-h-[200px]",
      className
    )}>
      <div className={cn(
        "flex flex-col items-center gap-3",
        variant === "default" ? "gap-3" : "gap-2"
      )}>
        <Loader2 className={cn(
          "animate-spin text-primary",
          variant === "default" ? "h-8 w-8" : "h-6 w-6"
        )} />
        <div className="text-center">
          <h3 className={cn(
            "font-medium",
            variant === "default" ? "text-lg" : "text-base"
          )}>
            {title}
          </h3>
          {description && (
            <p className={cn(
              "text-muted-foreground",
              variant === "default" ? "text-sm" : "text-xs"
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}