"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GaugeChartProps {
  value: number
  max: number
  title: string
  unit?: string
  color?: string
  icon?: React.ReactNode
}

export function GaugeChart({ 
  value, 
  max, 
  title, 
  unit = "", 
  color = "hsl(var(--primary))",
  icon 
}: GaugeChartProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  
  // Determine color based on percentage
  let gaugeColor = color
  if (percentage > 80) {
    gaugeColor = "hsl(var(--destructive))"
  } else if (percentage > 60) {
    gaugeColor = "hsl(var(--warning))"
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        <div className="relative w-32 h-32">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--border))"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={gaugeColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{value}{unit}</span>
            <span className="text-xs text-muted-foreground mt-1">{percentage.toFixed(0)}%</span>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="h-2 rounded-full" 
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: gaugeColor 
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}