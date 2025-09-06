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
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

interface SeriesConfig {
  dataKey: string
  name: string
  color: string
}

interface MultiSeriesChartProps {
  data: any[]
  title: string
  series: SeriesConfig[]
  unit?: string
  icon?: React.ReactNode
}

export function MultiSeriesChart({ 
  data, 
  title, 
  series, 
  unit = "", 
  icon 
}: MultiSeriesChartProps) {
  // Format data for display
  const formattedData = data.map(item => {
    const formattedItem: any = { ...item }
    series.forEach(s => {
      formattedItem[s.dataKey] = unit === "%" ? parseFloat(item[s.dataKey]) : item[s.dataKey]
    })
    return formattedItem
  })

  const chartConfig = series.reduce((acc, s) => ({
    ...acc,
    [s.dataKey]: {
      label: s.name,
      color: s.color,
    }
  }), {})

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer config={chartConfig} className="h-full w-full">
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
                    formatter={(value) => [`${value}${unit}`, '']}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              {series.map((s, index) => (
                <Line
                  key={index}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2, fill: "#fff" }}
                  activeDot={{ r: 5, strokeWidth: 2, fill: "#fff" }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}