"use server";

import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar";
import { getAllDatapoints } from "@/server-actions/summary";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import { CustomPieChartByCategory } from "./custom-pie-chart";
import { Transaction } from "@prisma/client";

export default async function Page() {
  const allTransactions = await getAllDatapoints();

  if (!allTransactions.success || !allTransactions.data) {
    return <div className="p-4">No data available</div>;
  }

  // Group by category and sum AMOUNT_CHF
  const categoryTotals: Record<string, number> = {};

  allTransactions.data.forEach((trx: Transaction) => {
    const category = trx.CATEGORY || "Not specified";
    const amountChf = Number(trx.AMOUNT_CHF) || 0;

    if (!categoryTotals[category]) {
      categoryTotals[category] = 0;
    }
    categoryTotals[category] += amountChf;
  });

  const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
    label: category,
    value: total,
  }));

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 42)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto p-4 space-y-6">
          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Transaction Data</CardTitle>
            </CardHeader>
            <CardContent>
              <CustomPieChartByCategory
                data={chartData}
                texts={{
                  title: "Transactions per Category",
                  description: "Total amount (converted to CHF)",
                  visitorLabel: "CHF",
                  footerText: "",
                  footerSubText:
                    "Showing total transaction amounts in CHF per category",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}