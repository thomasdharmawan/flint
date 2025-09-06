"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Play, Square, RotateCcw, MoreHorizontal, Trash2, Settings, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface VMActionButtonsProps {
  status: "running" | "stopped" | "paused"
  onStart?: () => void
  onStop?: () => void
  onReboot?: () => void
  onPause?: () => void
  onEdit?: () => void
  onDelete?: () => void
  compact?: boolean
  disabled?: boolean
}

export function VMActionButtons({
  status,
  onStart,
  onStop,
  onReboot,
  onPause,
  onEdit,
  onDelete,
  compact = false,
  disabled = false,
}: VMActionButtonsProps) {
  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "hover:bg-accent/50 hover:text-accent-foreground transition-all duration-200 focus-premium hover:shadow-sm active:scale-95",
              "bg-surface-2 border-border/50"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">VM Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-surface-2 border-border/50 shadow-lg animate-scale-in">
          {status === "stopped" && onStart && (
            <DropdownMenuItem
              onClick={onStart}
              className={cn(
                "hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors duration-150 cursor-pointer rounded-md",
                "text-foreground"
              )}
            >
              <Play className="mr-2 h-4 w-4" />
              Start VM
            </DropdownMenuItem>
          )}
          {status === "paused" && onStart && (
            <DropdownMenuItem
              onClick={onStart}
              className={cn(
                "hover:bg-primary/5 hover:text-primary focus:bg-primary/5 focus:text-primary transition-colors duration-150 cursor-pointer rounded-md",
                "text-foreground"
              )}
            >
              <Play className="mr-2 h-4 w-4" />
              Resume VM
            </DropdownMenuItem>
          )}
          {status === "running" && (
            <>
              {onPause && (
                <DropdownMenuItem 
                  onClick={onPause} 
                  className={cn(
                    "hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground transition-colors duration-150 cursor-pointer rounded-md",
                    "text-foreground"
                  )}
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause VM
                </DropdownMenuItem>
              )}
              {onStop && (
                <DropdownMenuItem
                  onClick={onStop}
                  className={cn(
                    "hover:bg-destructive/5 hover:text-destructive focus:bg-destructive/5 focus:text-destructive transition-colors duration-150 cursor-pointer rounded-md",
                    "text-foreground"
                  )}
                >
                  <Square className="mr-2 h-4 w-4" />
                  Stop VM
                </DropdownMenuItem>
              )}
              {onReboot && (
                <DropdownMenuItem 
                  onClick={onReboot} 
                  className={cn(
                    "hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground transition-colors duration-150 cursor-pointer rounded-md",
                    "text-foreground"
                  )}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reboot VM
                </DropdownMenuItem>
              )}
            </>
          )}
          {(onEdit || onDelete) && <DropdownMenuSeparator className="bg-border/50" />}
          {onEdit && (
            <DropdownMenuItem 
              onClick={onEdit} 
              className={cn(
                "hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground transition-colors duration-150 cursor-pointer rounded-md",
                "text-foreground"
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              Edit Settings
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className={cn(
                "text-destructive hover:bg-destructive/5 focus:bg-destructive/5 focus:text-destructive transition-colors duration-150 cursor-pointer rounded-md",
                "text-foreground"
              )}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete VM
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 animate-fade-scale">
      {status === "stopped" && onStart && (
        <Button
          size="sm"
          onClick={onStart}
          disabled={disabled}
          className={cn(
            "hover-premium transition-all duration-200 focus-premium active:scale-95",
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border-border/50"
          )}
        >
          <Play className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Start</span>
        </Button>
      )}
      {status === "paused" && onStart && (
        <Button
          size="sm"
          onClick={onStart}
          disabled={disabled}
          className={cn(
            "hover-premium transition-all duration-200 focus-premium active:scale-95",
            "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm border-border/50"
          )}
        >
          <Play className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Resume</span>
        </Button>
      )}
      {status === "running" && (
        <>
          {onPause && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPause}
              disabled={disabled}
              className={cn(
                "hover-premium transition-all duration-200 focus-premium active:scale-95",
                "bg-surface-2 border-border/50 shadow-sm hover:bg-accent/10 hover:text-accent-foreground"
              )}
            >
              <Pause className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Pause</span>
            </Button>
          )}
          {onStop && (
            <Button
              size="sm"
              variant="outline"
              onClick={onStop}
              disabled={disabled}
              className={cn(
                "hover-premium transition-all duration-200 focus-premium active:scale-95",
                "bg-surface-2 border-border/50 shadow-sm hover:bg-destructive/5 hover:text-destructive hover:border-destructive/30"
              )}
            >
              <Square className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Stop</span>
            </Button>
          )}
          {onReboot && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReboot}
              disabled={disabled}
              className={cn(
                "hover-premium transition-all duration-200 focus-premium active:scale-95",
                "bg-surface-2 border-border/50 shadow-sm hover:bg-accent/10 hover:text-accent-foreground"
              )}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              <span className="hidden sm:inline">Reboot</span>
            </Button>
          )}
        </>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            className={cn(
              "hover-premium transition-all duration-200 focus-premium active:scale-95",
              "bg-surface-2 border-border/50 shadow-sm hover:bg-accent/10 hover:text-accent-foreground"
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 bg-surface-2 border-border/50 shadow-lg animate-scale-in">
          {onEdit && (
            <DropdownMenuItem 
              onClick={onEdit} 
              className={cn(
                "hover:bg-accent/10 hover:text-accent-foreground focus:bg-accent/10 focus:text-accent-foreground transition-colors duration-150 cursor-pointer rounded-md",
                "text-foreground"
              )}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              {onEdit && <DropdownMenuSeparator className="bg-border/50" />}
              <DropdownMenuItem
                onClick={onDelete}
                className={cn(
                  "text-destructive hover:bg-destructive/5 focus:bg-destructive/5 focus:text-destructive transition-colors duration-150 cursor-pointer rounded-md",
                  "text-foreground"
                )}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
