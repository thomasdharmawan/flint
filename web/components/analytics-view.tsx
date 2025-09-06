"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
// import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { hostAPI } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import {
  Activity,
  TrendingUp,
  BarChart3,
  LineChart,
  PieChart,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  HardDrive,
  Network,
  Cpu,
  MemoryStick,
  Server,
} from "lucide-react"

export function AnalyticsView() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("overview")
  const [timeRange, setTimeRange] = useState("24h")
  const [metrics, setMetrics] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true)
        const data = await hostAPI.getResources()
        setMetrics(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics data")
        toast({
          title: "Error",
          description: "Failed to load analytics data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [timeRange])

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-surface-2 rounded-md animate-pulse" />
            <div className="h-9 w-32 bg-surface-2 rounded-md animate-pulse" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 bg-surface-2 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Memory Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="h-64 bg-surface-2 rounded-lg animate-pulse" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-display font-bold text-foreground">Analytics</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Analytics</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-slide-up-fade">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-1">Monitor and analyze your virtualization infrastructure performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-border/50 bg-surface-2">
              <SelectValue placeholder="24h" />
            </SelectTrigger>
            <SelectContent className="bg-surface-2 border-border/50">
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="6h">6 Hours</SelectItem>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="hover-premium transition-all duration-200">
            <Activity className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="cpu" className="hover-premium transition-all duration-200">
            <Activity className="mr-2 h-4 w-4" />
            CPU
          </TabsTrigger>
          <TabsTrigger value="memory" className="hover-premium transition-all duration-200">
            <TrendingUp className="mr-2 h-4 w-4" />
            Memory
          </TabsTrigger>
          <TabsTrigger value="storage" className="hover-premium transition-all duration-200">
            <HardDrive className="mr-2 h-4 w-4" />
            Storage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 bg-surface-2 rounded-lg shadow-sm">
                  {/* Placeholder for CPU chart */}
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mb-2" />
                      <p className="text-sm">CPU analytics chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 bg-surface-2 rounded-lg shadow-sm">
                  {/* Placeholder for memory chart */}
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="h-12 w-12 mb-2" />
                      <p className="text-sm">Memory analytics chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Storage Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 bg-surface-2 rounded-lg shadow-sm">
                  {/* Placeholder for storage chart */}
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-12 w-12 mb-2" />
                      <p className="text-sm">Storage analytics chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-4 w-4" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-64 bg-surface-2 rounded-lg shadow-sm">
                  {/* Placeholder for network chart */}
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <Activity className="h-12 w-12 mb-2" />
                      <p className="text-sm">Network analytics chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Activity className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="font-medium">VM started</p>
                    <p className="text-sm text-muted-foreground">web-server-01 started successfully</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">2 min ago</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="font-medium">Network configured</p>
                    <p className="text-sm text-muted-foreground">eth0 connected to default network</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">5 min ago</div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="font-medium">High CPU usage detected</p>
                    <p className="text-sm text-muted-foreground">CPU usage exceeded 80% threshold</p>
                  </div>
                  <div className="ml-auto text-xs text-muted-foreground">10 min ago</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cpu" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                CPU Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-surface-2 rounded-lg shadow-sm">
                {/* Placeholder for CPU analytics */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-16 w-16 mb-4" />
                    <p className="text-lg">CPU Usage Analytics</p>
                    <p className="text-sm">Detailed CPU performance over time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="memory" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Memory Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-surface-2 rounded-lg shadow-sm">
                {/* Placeholder for memory analytics */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="h-16 w-16 mb-4" />
                    <p className="text-lg">Memory Usage Analytics</p>
                    <p className="text-sm">Detailed memory performance over time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          <Card className="animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                Storage Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-surface-2 rounded-lg shadow-sm">
                {/* Placeholder for storage analytics */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <PieChart className="h-16 w-16 mb-4" />
                    <p className="text-lg">Storage Usage Analytics</p>
                    <p className="text-sm">Detailed storage performance over time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
