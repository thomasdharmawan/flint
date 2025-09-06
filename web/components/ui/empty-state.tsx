import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  icon,
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center min-h-[300px] rounded-lg border border-dashed p-8 text-center",
      className
    )}>
      <div className="flex flex-col items-center gap-4">
        {icon && (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
          {description && (
            <p className="text-muted-foreground text-sm">
              {description}
            </p>
          )}
        </div>
        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  )
}