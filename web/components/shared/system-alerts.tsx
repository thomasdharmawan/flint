import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Cpu, MemoryStick, HardDrive, AlertCircle } from "lucide-react"
import { HostResources } from "@/lib/api"

interface Alert {
  type: "warning" | "info" | "error" | "success"
  message: string
  time: string
  priority: number // 1 = highest, 5 = lowest
  category: "cpu" | "memory" | "storage" | "vm" | "system" | "network"
}

interface SystemAlertsProps {
  alerts: Alert[]
  hostResources?: HostResources
}

export function SystemAlerts({ alerts, hostResources }: SystemAlertsProps) {
  // Generate dynamic alerts based on resource usage
  const generateResourceAlerts = (): Alert[] => {
    if (!hostResources) return []

    const resourceAlerts: Alert[] = []
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // CPU Usage Alert
    if (hostResources.cpu_cores > 0) {
      // This is a placeholder since we don't have CPU usage percentage directly
      // In a real implementation, we would calculate this from VM data
    }

    // Memory Usage Alert
    const memoryUsagePercent = hostResources.total_memory_kb > 0 
      ? ((hostResources.total_memory_kb - hostResources.free_memory_kb) / hostResources.total_memory_kb) * 100 
      : 0
    
    if (memoryUsagePercent > 90) {
      resourceAlerts.push({
        type: "error",
        message: `Critical: Host memory usage is at ${memoryUsagePercent.toFixed(1)}%`,
        time: now,
        priority: 1,
        category: "memory"
      })
    } else if (memoryUsagePercent > 80) {
      resourceAlerts.push({
        type: "warning",
        message: `High memory usage: ${memoryUsagePercent.toFixed(1)}% of total memory in use`,
        time: now,
        priority: 2,
        category: "memory"
      })
    }

    // Storage Usage Alert
    const storageUsagePercent = hostResources.storage_total_b > 0 
      ? (hostResources.storage_used_b / hostResources.storage_total_b) * 100 
      : 0
    
    if (storageUsagePercent > 95) {
      resourceAlerts.push({
        type: "error",
        message: `Critical: Storage usage is at ${storageUsagePercent.toFixed(1)}%`,
        time: now,
        priority: 1,
        category: "storage"
      })
    } else if (storageUsagePercent > 85) {
      resourceAlerts.push({
        type: "warning",
        message: `High storage usage: ${storageUsagePercent.toFixed(1)}% of total storage in use`,
        time: now,
        priority: 2,
        category: "storage"
      })
    }

    return resourceAlerts
  }

  const getAlertIcon = (type: Alert["type"], category: Alert["category"]) => {
    const baseClasses = "h-4 w-4"
    
    // Color based on type
    let colorClasses = ""
    switch (type) {
      case "error":
        colorClasses = "text-destructive"
        break
      case "warning":
        colorClasses = "text-warning"
        break
      case "success":
        colorClasses = "text-success"
        break
      default:
        colorClasses = "text-primary"
    }

    // Icon based on category
    switch (category) {
      case "cpu":
        return <Cpu className={`${baseClasses} ${colorClasses}`} />
      case "memory":
        return <MemoryStick className={`${baseClasses} ${colorClasses}`} />
      case "storage":
        return <HardDrive className={`${baseClasses} ${colorClasses}`} />
      case "network":
        return <AlertCircle className={`${baseClasses} ${colorClasses}`} />
      case "vm":
        return <AlertCircle className={`${baseClasses} ${colorClasses}`} />
      default:
        return type === "error" || type === "warning" 
          ? <AlertTriangle className={`${baseClasses} ${colorClasses}`} />
          : <CheckCircle className={`${baseClasses} ${colorClasses}`} />
    }
  }

  const getAlertBorderClass = (type: Alert["type"]) => {
    switch (type) {
      case "error":
        return "border-l-destructive"
      case "warning":
        return "border-l-warning"
      case "success":
        return "border-l-success"
      default:
        return "border-l-primary"
    }
  }

  // Combine static alerts with dynamic resource alerts
  const allAlerts = [...alerts, ...generateResourceAlerts()]
  
  // Sort by priority (highest first) and limit to top 5
  const sortedAlerts = allAlerts
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 5)

  if (sortedAlerts.length === 0) return null

  return (
    <Card className="border-l-4 border-l-accent">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-accent" />
          System Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2 px-3">
        <div className="space-y-2">
          {sortedAlerts.map((alert, index) => (
            <div 
              key={index} 
              className={`flex items-start justify-between rounded bg-muted/50 p-3 border-l-4 ${getAlertBorderClass(alert.type)}`}
            >
              <div className="flex items-start gap-2">
                {getAlertIcon(alert.type, alert.category)}
                <div className="flex-1">
                  <span className="text-sm">{alert.message}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">
                      {alert.category}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}