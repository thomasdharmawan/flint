"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, HardDrive, Network, TrendingUp } from "lucide-react"

interface QuickAction {
  label: string
  icon: React.ReactNode
  onClick: () => void
}

interface QuickActionsProps {
  actions?: QuickAction[]
  title?: string
}



export function QuickActions({ actions, title = "Quick Actions" }: QuickActionsProps) {
  const router = useRouter()

  const handleAction = (action: QuickAction) => {
    switch (action.label) {
      case "Create New VM":
        router.push("/vms/create")
        break
      case "Add Storage Pool":
        router.push("/storage")
        break
      case "Configure Network":
        router.push("/networking")
        break
      case "View Performance":
        router.push("/analytics")
        break
      default:
        action.onClick()
    }
  }

  const finalActions = actions || [
    {
      label: "Create New VM",
      icon: <Plus className="mr-2 h-4 w-4" />,
      onClick: () => router.push("/vms/create"),
    },
    {
      label: "Add Storage Pool",
      icon: <HardDrive className="mr-2 h-4 w-4" />,
      onClick: () => router.push("/storage"),
    },
    {
      label: "Configure Network",
      icon: <Network className="mr-2 h-4 w-4" />,
      onClick: () => router.push("/networking"),
    },
    {
      label: "View Performance",
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
      onClick: () => router.push("/analytics"),
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {finalActions.map((action, index) => (
          <Button
            key={index}
            variant="outline"
            className="w-full justify-start bg-transparent"
            onClick={() => handleAction(action)}
          >
            {action.icon}
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
