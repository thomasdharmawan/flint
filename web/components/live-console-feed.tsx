"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Terminal, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface LiveConsoleFeedProps {
  vmId: string
  vmName: string
  onSSHReady?: (ip: string) => void
}

export function LiveConsoleFeed({ vmId, vmName, onSSHReady }: LiveConsoleFeedProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [vmIP, setVmIP] = useState<string | null>(null)
  const [sshReady, setSSHReady] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    connectToConsole()
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [vmId])

  useEffect(() => {
    // Auto-scroll to bottom when new logs arrive
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const connectToConsole = async () => {
    try {
      // Get WebSocket connection details
      const response = await fetch(`/api/vms/${vmId}/console-stream`)
      if (!response.ok) return

      const { websocket_path } = await response.json()
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}${websocket_path}`

      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
        addLog("🔌 Connected to VM console")
      }

      ws.onmessage = (event) => {
        const logLine = event.data.toString()
        addLog(logLine)
        
        // Parse for important events
        parseLogLine(logLine)
      }

      ws.onclose = () => {
        setIsConnected(false)
        addLog("🚫 Console disconnected")
      }

      ws.onerror = () => {
        addLog("❌ Console connection error")
      }
    } catch (err) {
      addLog("❌ Failed to connect to console")
    }
  }

  const addLog = (line: string) => {
    setLogs(prev => [...prev.slice(-50), line]) // Keep last 50 lines
  }

  const parseLogLine = (line: string) => {
    // Detect cloud-init completion
    if (line.includes("cloud-init") && line.includes("finished")) {
      addLog("✅ Cloud-init configuration complete")
    }

    // Detect SSH service start
    if (line.includes("ssh") && (line.includes("started") || line.includes("active"))) {
      setSSHReady(true)
      addLog("🔑 SSH service is ready")
    }

    // Extract IP address
    const ipMatch = line.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/)
    if (ipMatch && !vmIP) {
      const ip = ipMatch[1]
      if (ip !== "127.0.0.1" && !ip.startsWith("169.254")) {
        setVmIP(ip)
        setSSHReady(true)
        addLog(`🌐 VM IP: ${ip}`)
        onSSHReady?.(ip)
      }
    }
  }

  const copySSHCommand = () => {
    if (!vmIP) return
    const command = `ssh ubuntu@${vmIP}`
    navigator.clipboard.writeText(command)
    toast({
      title: "SSH Command Copied!",
      description: `Copied: ${command}`,
    })
  }

  const openFullConsole = () => {
    window.open(`/vms/console?id=${vmId}`, '_blank')
  }

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            <span>Live Console - {vmName}</span>
            {isConnected && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Connected
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {sshReady && vmIP && (
              <Button size="sm" variant="outline" onClick={copySSHCommand}>
                <Copy className="mr-1 h-3 w-3" />
                Copy SSH
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={openFullConsole}>
              <ExternalLink className="mr-1 h-3 w-3" />
              Full Console
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64 bg-black text-green-400 font-mono text-xs overflow-y-auto p-4">
          {logs.length === 0 ? (
            <div className="text-gray-500">Waiting for console output...</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
        
        {sshReady && vmIP && (
          <div className="p-4 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">🎉 VM Ready!</p>
                <p className="text-xs text-green-600">SSH: ubuntu@{vmIP}</p>
              </div>
              <Button size="sm" onClick={copySSHCommand} className="bg-green-600 hover:bg-green-700">
                <Copy className="mr-1 h-3 w-3" />
                Copy SSH Command
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}