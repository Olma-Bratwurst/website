"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/Shadcn/ui/chart";
import { TriangleAlert } from "lucide-react";

// Define a set of predefined colors
const predefinedColors = [
  "hsl(210, 100%, 56%)", // Blue
  "hsl(34, 100%, 50%)", // Orange
  "hsl(122, 39%, 49%)", // Green
  "hsl(0, 100%, 50%)", // Red
  "hsl(274, 82%, 60%)", // Purple
  "hsl(60, 100%, 50%)", // Yellow
  "hsl(180, 66%, 49%)", // Cyan
  "hsl(300, 76%, 72%)", // Pink
  "hsl(40, 100%, 65%)", // Light Orange
  "hsl(90, 100%, 50%)", // Lime Green
];

interface DataItem {
  label: string;
  value: number;
}

interface Texts {
  description: string;
  title: string;
  chartLabel: string;
}

interface CustomBarChartPerDayProps {
  data: DataItem[];
  texts: Texts;
}

export function CustomBarChartPerDay({
  data,
  texts,
}: CustomBarChartPerDayProps) {
  // Use only the value data
  const chartData = data.map((item) => ({
    date: item.label, // Now `label` is correctly referenced
    value: item.value,
  }));

  const chartConfig = {
    value: {
      label: texts.chartLabel,
      color: predefinedColors[0], // Pick the first color from predefined colors
    },
  } satisfies ChartConfig;

  const totalvalue = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  return (
    <Card className="flex flex-col mb-3 sm:mr-3">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{texts.title}</CardTitle>
          <CardDescription>{texts.description}</CardDescription>
        </div>
        <div className="flex">
          <button className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              {chartConfig.value.label}
            </span>
            <span className="text-lg font-bold leading-none sm:text-3xl">
              {totalvalue.toLocaleString()}
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        {chartData.length > 0 ? (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey="views"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Bar dataKey="value" fill={chartConfig.value.color} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex justify-center items-center h-[250px]">
            <TriangleAlert size="40px" />
            <span className="text-sm text-black ml-5">No data to show!</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
