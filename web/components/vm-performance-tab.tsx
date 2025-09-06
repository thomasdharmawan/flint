"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Cpu, MemoryStick, HardDrive, Network } from "lucide-react"
import { PerformanceChart } from "@/components/charts/performance-chart"
import { MultiSeriesChart } from "@/components/charts/multi-series-chart"
import { GaugeChart } from "@/components/charts/gauge-chart"

interface VMPerformanceTabProps {
  vmUuid: string
}

export function VMPerformanceTab({ vmUuid }: VMPerformanceTabProps) {
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([])

  useEffect(() => {
    if (!vmUuid) return

    const fetchPerformance = async () => {
      try {
        const response = await fetch(`/api/vms/${vmUuid}/performance`)
        if (response.ok) {
          const data = await response.json()
          setPerformanceData(data)

          // Add to history for charts
          const timestamp = new Date().toLocaleTimeString()
          const historyEntry = {
            time: timestamp,
            cpu: ((data.cpu_nanosecs / 1000000000) * 100).toFixed(1),
            memory: formatMemory(data.memory_used_kb),
            diskRead: (data.disk_read_bytes / 1024 / 1024).toFixed(1),
            diskWrite: (data.disk_write_bytes / 1024 / 1024).toFixed(1),
            netRx: (data.net_rx_bytes / 1024 / 1024).toFixed(1),
            netTx: (data.net_tx_bytes / 1024 / 1024).toFixed(1)
          }

          setPerformanceHistory(prev => {
            const newHistory = [...prev, historyEntry]
            // Keep only last 20 data points
            return newHistory.slice(-20)
          })
        }
      } catch (err) {
        console.error("Failed to fetch performance:", err)
      }
    }

    // Initial fetch
    fetchPerformance()

    // Poll every 5 seconds
    const interval = setInterval(fetchPerformance, 5000)

    return () => clearInterval(interval)
  }, [vmUuid])

  const formatMemory = (kb: number) => {
    const mb = kb / 1024;
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${Math.round(mb)}MB`;
  }

  if (!performanceData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading performance data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Gauges */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GaugeChart
          value={parseFloat(((performanceData.cpu_nanosecs / 1000000000) * 100).toFixed(1))}
          max={100}
          title="CPU Usage"
          unit="%"
          icon={<Cpu className="h-4 w-4" />}
        />
        <GaugeChart
          value={parseFloat((performanceData.memory_used_kb / 1024 / 1024).toFixed(1))}
          max={parseFloat((performanceData.memory_max_kb / 1024 / 1024).toFixed(1))}
          title="Memory Usage"
          unit="GB"
          icon={<MemoryStick className="h-4 w-4" />}
        />
        <GaugeChart
          value={parseFloat((performanceData.disk_read_bytes / 1024 / 1024).toFixed(1))}
          max={1000}
          title="Disk Read"
          unit="MB"
          icon={<HardDrive className="h-4 w-4" />}
        />
        <GaugeChart
          value={parseFloat((performanceData.net_rx_bytes / 1024 / 1024).toFixed(1))}
          max={1000}
          title="Network RX"
          unit="MB"
          icon={<Network className="h-4 w-4" />}
        />
      </div>

      {/* Detailed Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <PerformanceChart
          data={performanceHistory}
          title="CPU Performance"
          dataKey="cpu"
          color="#2563eb"
          unit="%"
          icon={<Cpu className="h-4 w-4" />}
        />
        
        <PerformanceChart
          data={performanceHistory}
          title="Memory Usage"
          dataKey="memory"
          color="#7c3aed"
          unit="MB"
          icon={<MemoryStick className="h-4 w-4" />}
        />
        
        <MultiSeriesChart
          data={performanceHistory}
          title="Disk I/O"
          series={[
            { dataKey: "diskRead", name: "Read", color: "#16a34a" },
            { dataKey: "diskWrite", name: "Write", color: "#dc2626" }
          ]}
          unit="MB"
          icon={<HardDrive className="h-4 w-4" />}
        />
        
        <MultiSeriesChart
          data={performanceHistory}
          title="Network I/O"
          series={[
            { dataKey: "netRx", name: "Received", color: "#0891b2" },
            { dataKey: "netTx", name: "Transmitted", color: "#ea580c" }
          ]}
          unit="MB"
          icon={<Network className="h-4 w-4" />}
        />
      </div>
    </div>
  )
}
