"use client"

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface PerformanceChartProps {
  data: any[]
  title: string
  dataKey: string
  color: string
  unit?: string
  icon?: React.ReactNode
}

export function PerformanceChart({ 
  data, 
  title, 
  dataKey, 
  color, 
  unit = "", 
  icon 
}: PerformanceChartProps) {
  // Format data for display
  const formattedData = data.map(item => ({
    ...item,
    [dataKey]: unit === "%" ? parseFloat(item[dataKey]) : item[dataKey]
  }))

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ChartContainer config={{
          [dataKey]: {
            label: title,
            color: color,
          },
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.3} />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12 }}
                tickMargin={10}
              />
              <YAxis 
                domain={unit === "%" ? [0, 100] : undefined}
                tick={{ fontSize: 12 }}
                tickMargin={10}
                tickFormatter={(value) => `${value}${unit}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent 
                    indicator="line"
                    formatter={(value) => [`${value}${unit}`, title]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}