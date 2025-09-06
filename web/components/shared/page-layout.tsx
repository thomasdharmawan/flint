import type React from "react"
import { AppShell } from "@/components/app-shell"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function PageLayout({ children, title, description, actions }: PageLayoutProps) {
  return (
    <AppShell>
      {(title || description || actions) && (
        <div className="border-b border-border/50 bg-surface-1/95 backdrop-blur-sm supports-[backdrop-filter]:bg-surface-1/80 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-6 sm:p-8 lg:p-10">
            {(title || description) && (
              <div className="space-y-1">
                {title && <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            )}
            {actions && <div className="flex items-center gap-2 self-start sm:self-auto">{actions}</div>}
          </div>
        </div>
      )}
      <div>
        {children}
      </div>
    </AppShell>
  )
}
