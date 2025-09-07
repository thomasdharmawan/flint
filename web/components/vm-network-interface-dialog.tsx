"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Network, Router, Cable, Zap } from "lucide-react"
import { networkAPI, VirtualNetwork, SystemInterface } from "@/lib/api"

interface VMNetworkInterfaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vmUuid: string
  onSuccess: () => void
}

export function VMNetworkInterfaceDialog({ 
  open, 
  onOpenChange, 
  vmUuid, 
  onSuccess 
}: VMNetworkInterfaceDialogProps) {
  const { toast } = useToast()
  
  // Form state
  const [interfaceType, setInterfaceType] = useState("bridge")
  const [source, setSource] = useState("")
  const [model, setModel] = useState("virtio")
  const [macAddress, setMacAddress] = useState("")
  const [autoMac, setAutoMac] = useState(true)
  
  // Data state
  const [virtualNetworks, setVirtualNetworks] = useState<VirtualNetwork[]>([])
  const [systemInterfaces, setSystemInterfaces] = useState<SystemInterface[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAttaching, setIsAttaching] = useState(false)

  useEffect(() => {
    if (open) {
      loadNetworkData()
      if (autoMac) {
        generateMacAddress()
      }
    }
  }, [open, autoMac])

  const loadNetworkData = async () => {
    try {
      setIsLoading(true)
      const [networks, interfaces] = await Promise.all([
        networkAPI.getNetworks(),
        networkAPI.getSystemInterfaces()
      ])
      setVirtualNetworks(networks)
      setSystemInterfaces(interfaces)
    } catch (error) {
      console.error("Failed to load network data:", error)
      toast({
        title: "Error",
        description: "Failed to load network data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateMacAddress = () => {
    // Generate a random MAC address with VMware OUI (00:50:56)
    const oui = "52:54:00" // QEMU/KVM OUI
    const nic = Array.from({ length: 3 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':')
    setMacAddress(`${oui}:${nic}`)
  }

  const getAvailableSources = () => {
    switch (interfaceType) {
      case "bridge":
        return systemInterfaces.filter(iface => 
          iface.type === 'bridge' || iface.type === 'physical'
        )
      case "network":
        return virtualNetworks.map(net => ({
          name: net.name,
          type: 'virtual-network',
          state: net.is_active ? 'active' : 'inactive'
        }))
      case "direct":
        return systemInterfaces.filter(iface => 
          iface.type === 'physical'
        )
      default:
        return []
    }
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'bridge': return <Router className="h-4 w-4" />
      case 'physical': return <Cable className="h-4 w-4" />
      case 'virtual-network': return <Network className="h-4 w-4" />
      default: return <Network className="h-4 w-4" />
    }
  }

  const handleAttach = async () => {
    if (!source || !model) {
      toast({
        title: "Validation Error",
        description: "Please select a source and model",
        variant: "destructive",
      })
      return
    }

    if (!autoMac && !macAddress) {
      toast({
        title: "Validation Error", 
        description: "Please provide a MAC address or enable automatic generation",
        variant: "destructive",
      })
      return
    }

    try {
      setIsAttaching(true)
      
      const response = await fetch(`/api/vms/${vmUuid}/attach-network`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interfaceType,
          source,
          model,
          macAddress: autoMac ? undefined : macAddress
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to attach network interface')
      }

      toast({
        title: "Success",
        description: "Network interface attached successfully",
      })

      // Reset form
      setInterfaceType("bridge")
      setSource("")
      setModel("virtio")
      setMacAddress("")
      setAutoMac(true)
      
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error('Network attachment failed:', error)
      toast({
        title: "Error",
        description: `Failed to attach network interface: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      })
    } finally {
      setIsAttaching(false)
    }
  }

  const availableSources = getAvailableSources()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Virtual Network Interface</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Interface Type Selection */}
          <div className="space-y-3">
            <Label>Interface Type</Label>
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  interfaceType === 'bridge' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setInterfaceType('bridge')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Router className="h-4 w-4" />
                  <span className="font-medium">Bridge to LAN</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect directly to host network via bridge
                </p>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  interfaceType === 'network' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setInterfaceType('network')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4" />
                  <span className="font-medium">Virtual Network</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Connect to libvirt virtual network
                </p>
              </div>
              
              <div 
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  interfaceType === 'direct' 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setInterfaceType('direct')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Cable className="h-4 w-4" />
                  <span className="font-medium">Direct Attachment</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Direct connection to physical interface
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 p-3 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading network sources...</span>
              </div>
            ) : (
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${interfaceType} source`} />
                </SelectTrigger>
                <SelectContent>
                  {availableSources.map((src: any) => (
                    <SelectItem key={src.name} value={src.name}>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(src.type)}
                        <span>{src.name}</span>
                        {src.state && (
                          <Badge 
                            variant={src.state === 'active' || src.state === 'up' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {src.state}
                          </Badge>
                        )}
                        {src.ip_addresses && src.ip_addresses.length > 0 && (
                          <span className="text-xs text-muted-foreground">
                            ({src.ip_addresses[0]})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {availableSources.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">
                No {interfaceType} sources available. 
                {interfaceType === 'bridge' && " Create a bridge interface first."}
                {interfaceType === 'network' && " Create a virtual network first."}
              </p>
            )}
          </div>

          <Separator />

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Network Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="virtio">
                  <div className="space-y-1">
                    <div className="font-medium">virtio</div>
                    <div className="text-xs text-muted-foreground">
                      High performance paravirtualized driver (recommended)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="e1000">
                  <div className="space-y-1">
                    <div className="font-medium">e1000</div>
                    <div className="text-xs text-muted-foreground">
                      Intel Gigabit Ethernet (good compatibility)
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="rtl8139">
                  <div className="space-y-1">
                    <div className="font-medium">rtl8139</div>
                    <div className="text-xs text-muted-foreground">
                      Realtek Fast Ethernet (legacy compatibility)
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* MAC Address Configuration */}
          <div className="space-y-3">
            <Label>MAC Address</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto-mac"
                  checked={autoMac}
                  onChange={() => setAutoMac(true)}
                />
                <Label htmlFor="auto-mac">Generate automatically</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual-mac"
                  checked={!autoMac}
                  onChange={() => setAutoMac(false)}
                />
                <Label htmlFor="manual-mac">Set manually</Label>
              </div>
              
              {!autoMac && (
                <Input
                  placeholder="52:54:00:xx:xx:xx"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                />
              )}
              
              {autoMac && macAddress && (
                <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Generated MAC: </span>
                    <span className="font-mono">{macAddress}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAttach}
            disabled={isAttaching || !source || !model || (!autoMac && !macAddress)}
          >
            {isAttaching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Attaching...
              </>
            ) : (
              "Add Interface"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}