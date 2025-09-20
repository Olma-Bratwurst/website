"use client"

import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/Shadcn/ui/chart";
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts";

interface ChartData {
  date: string;
  index: number;
  spending: number;
  fill: string;
}

interface BarchartArgs {
  config: ChartConfig,
  data: ChartData[]
}

export function Linechart(args: BarchartArgs) {
  return (
    <ChartContainer config={args.config}>
      <LineChart
        accessibilityLayer
        data={args.data}
        margin={{
          left: 30,
          right: 30,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="index"
          tickLine={true}

          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => args.data[value]!.date.slice(0, 2)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Line
          dataKey="spending"
          type="natural"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        >
          <LabelList
                position="top"
                offset={30}
                className="fill-foreground font-bold"
                fontSize={16}
              />
              </Line>
      </LineChart>
    </ChartContainer>
  )
}
