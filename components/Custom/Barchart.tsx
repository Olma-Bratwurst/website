import { LineChart } from "lucide-react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../Shadcn/ui/chart";
import { CartesianGrid, Line, XAxis } from "recharts";


export function Barchart() {
  return <ChartContainer config={chartConfig}>
    <LineChart
      accessibilityLayer
      data={chartData}
      margin={{
        left: 12,
        right: 12,
      }}
    >
      <CartesianGrid vertical={false} />
      <XAxis
        dataKey="month"
        tickLine={false}

        axisLine={false}
        tickMargin={8}
        tickFormatter={(value) => value.slice(0, 3)}
      />
      <ChartTooltip
        cursor={false}
        content={<ChartTooltipContent hideLabel />}
      />
      <Line
        dataKey="desktop"
        type="natural"
        stroke="var(--color-desktop)"
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ChartContainer>
}
