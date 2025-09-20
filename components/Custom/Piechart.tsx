"use client"

import { Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/Shadcn/ui/chart"

export const description = "A donut chart"

const chartData = [
  { category: "leisure", spending: 275, fill: "var(--chart-1)" },
  { category: "clothes", spending: 200, fill: "var(--chart-2)" },
  { category: "food", spending: 187, fill: "var(--chart-3)" },
  { category: "transportation", spending: 173, fill: "var(--chart-4)" },
  { category: "other", spending: 90, fill: "var(--chart-5)" },
]

const chartConfig = {
  spending: {
    label: "Money spent",
  },
  leisure: {
    label: "Leisure",
    color: "var(--chart-1)",
  },
  clothes: {
    label: "Clothes",
    color: "var(--chart-2)",
  },
  food: {
    label: "Food",
    color: "var(--chart-3)",
  },
  transportation: {
    label: "Transportation",
    color: "var(--chart-4)",
  },
  other: {
    label: "Other",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig

export function Piechart() {
  return (
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="spending"
              nameKey="category"
              innerRadius={60}
            />
          </PieChart>
        </ChartContainer>
  )
}          