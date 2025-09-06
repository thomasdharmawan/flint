import type React from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type StatusType =
  | "running"
  | "stopped"
  | "paused"
  | "error"
  | "warning"
  | "success"
  | "active"
  | "inactive"
  | "connected"
  | "disconnected"

interface StatusBadgeProps {
  status: StatusType
  children: React.ReactNode
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  running: "bg-primary text-primary-foreground border-primary/20",
  stopped: "bg-muted text-muted-foreground border-border/50",
  paused: "bg-accent text-accent-foreground border-accent/20",
  error: "bg-destructive text-destructive-foreground border-destructive/20",
  warning: "bg-accent text-accent-foreground border-accent/20",
  success: "bg-primary text-primary-foreground border-primary/20",
  active: "bg-primary text-primary-foreground border-primary/20",
  inactive: "bg-muted text-muted-foreground border-border/50",
  connected: "bg-primary text-primary-foreground border-primary/20",
  disconnected: "bg-destructive text-destructive-foreground border-destructive/20",
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "text-xs font-medium px-2 py-0.5 rounded-full shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105 focus-premium animate-fade-scale",
        statusStyles[status],
        className
      )}
    >
      {children}
    </Badge>
  )
}
