"use client";
import * as React from "react";
import { Label, Pie, PieChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/Shadcn/ui/chart";
import { Ellipsis, TriangleAlert } from "lucide-react";

interface DataItem {
  label: string;
  value: number | undefined;
  color?: string; // color is optional
}

interface Texts {
  [key: string]: string; // Example structure; modify based on your actual use case
}

interface CustomPieChartByCategoryProps {
  data: DataItem[];
  texts: Texts;
}

export function CustomPieChartByCategory({
  data,
  texts,
}: CustomPieChartByCategoryProps) {
  // Define a set of colors
  const predefinedColors = [
    "var(--chart-1)", // Blue
    "var(--chart-2)", // Orange
    "var(--chart-3)", // Green
    "var(--chart-4)", // Red
    "var(--chart-5)", // Purple
    "hsl(60, 100%, 50%)", // Yellow
    "hsl(180, 66%, 49%)", // Cyan
    "hsl(300, 76%, 72%)", // Pink
    "hsl(40, 100%, 65%)", // Light Orange
    "hsl(90, 100%, 50%)", // Lime Green
  ];

  const chartData = data.map((item: DataItem, index: number) => ({
    browser: item.label,
    visitors: item.value ?? 0, // Ensure value is never undefined
    fill: item.color || predefinedColors[index % predefinedColors.length],
  }));

  const chartConfig = data.reduce(
    (config: ChartConfig, item: DataItem, index: number) => {
      const labelKey = item.label?.toLowerCase() || "null";
      config[labelKey] = {
        label: item.label || "Not specified",
        color: item.color || predefinedColors[index % predefinedColors.length],
      };
      return config;
    },
    { visitors: { label: "Visitors", color: "#000000" } },
  );

  const totalVisitors = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.visitors!, 0);
  }, [chartData]);

  const hasData = data.length > 0;

  // console.log("chartData: ", chartData)

  return (
    <Card className="flex flex-col mb-3 sm:mr-3">
      <CardHeader className="items-center pb-0">
        <CardTitle>{texts.title}</CardTitle>
        <CardDescription>{texts.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {hasData ? (
          totalVisitors > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[220px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="visitors"
                  nameKey="browser"
                  innerRadius={60}
                  strokeWidth={5}
                >
                  <Label
                    content={({ viewBox }) => {
                      if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                        return (
                          <text
                            x={viewBox.cx}
                            y={viewBox.cy}
                            textAnchor="middle"
                            dominantBaseline="middle"
                          >
                            <tspan
                              x={viewBox.cx}
                              y={viewBox.cy}
                              className="fill-foreground text-2xl font-bold"
                            >
                              {totalVisitors.toLocaleString()}
                            </tspan>
                            <tspan
                              x={viewBox.cx}
                              y={(viewBox.cy || 0) + 24}
                              className="fill-muted-foreground"
                            >
                              {texts.visitorLabel}
                            </tspan>
                          </text>
                        );
                      }
                    }}
                  />
                </Pie>
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="flex justify-center items-center h-[250px]">
              <span className="text-muted-foreground">
                0 {texts.visitorLabel}
              </span>
            </div>
          )
        ) : (
          <div className="flex justify-center items-center h-[250px]">
            <TriangleAlert size="40px" />
            <span className="text-sm text-black ml-5">No data to show!</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {texts.footerText}
        </div>
        <div className="leading-none text-muted-foreground">
          {texts.footerSubText}
        </div>
      </CardFooter>
    </Card>
  );
}
