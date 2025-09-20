"use client"

import { Pie, PieChart } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/Shadcn/ui/chart"

export const description = "A donut chart"

interface ChartData {
  category: string;
  spending: number;
  fill: string;
}

interface PiechartArgs {
  chartConfig: ChartConfig;
  chartData: ChartData[];
}

export function Piechart(args: PiechartArgs) {
  return (
    <ChartContainer
      config={args.chartConfig}
      className="mx-auto aspect-square max-h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={args.chartData}
          dataKey="spending"
          nameKey="category"
          innerRadius={60}
        />
        <ChartLegend
          content={<ChartLegendContent nameKey="category" />}
          className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
