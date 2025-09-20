"use server";

import OverviewTable from "@/components/Custom/Tables/Overview/table-component";
import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import { Infobox } from "@/components/Custom/Infobox"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar"
import { PaymentsMap } from "@/components/Custom/Map";
import { getAllDatapoints } from "@/server-actions/summary";
import { Transaction } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import { CustomPieChartByCategory } from "./(public)/category/custom-pie-chart";
import { Linechart } from "@/components/Custom/Linechart";
import { ChartConfig } from "@/components/Shadcn/ui/chart";

export default async function Page() {
  // const data = await db.transaction.findMany({
  //   orderBy: { TRX_DATE: "desc" },
  //   take: 500,
  //   skip: 0,
  // });
  const allTransactions = await getAllDatapoints();

  const locationSet = new Set<string>();
  

  let incoming = 0;
  let outgoing = 0;

  allTransactions.data.forEach((dataPoint) => {
    if (dataPoint.POINT_OF_SALE_AND_LOCATION) {
      locationSet.add(dataPoint.POINT_OF_SALE_AND_LOCATION!);
    }
    if (dataPoint.DIRECTION && dataPoint.AMOUNT) {
      if (dataPoint.DIRECTION === 1) {
        outgoing += dataPoint.AMOUNT!;
      }
      if (dataPoint.DIRECTION === 2) {
        incoming += dataPoint.AMOUNT!;
      }
    }
  })

  const chartDataIO = [
    { label: "Incoming", value: incoming },
    { label: "Outgoing", value: outgoing }
  ];

  ////////////////////////////////// CATEGORY ////////////////////////////////// 
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



  ////////////////////////////////// BOOKING TYPE ////////////////////////////////// 
  // Group by category and sum AMOUNT_CHF
  const categoryTotals2: Record<string, number> = {};

  allTransactions.data.forEach((trx: Transaction) => {
    const category = trx.BUCHUNGS_ART_NAME || "Not specified";
    const amountChf = Number(trx.AMOUNT_CHF) || 0;

    if (!categoryTotals2[category]) {
      categoryTotals2[category] = 0;
    }
    categoryTotals2[category] += amountChf;
  });

  const chartData2 = Object.entries(categoryTotals2).map(([category, total]) => ({
    label: category,
    value: total,
  }));

  let moneyMap = new Map<string, number>();
  allTransactions.data.forEach((trx: Transaction) => {
    if (trx.TRX_DATE && trx.AMOUNT && trx.DIRECTION) {
      let monthKeyArr = trx.TRX_DATE!.split("/");
      monthKeyArr.shift();
      let monthKey = monthKeyArr.join("/")
    if (!moneyMap.keys().some((key) => key == monthKey)) {
      moneyMap.set(monthKey, 0)
    }
    let new_amount = trx.DIRECTION! === 1 ? -trx.AMOUNT! : trx.AMOUNT!
    moneyMap.set(monthKey, moneyMap.get(monthKey)! + new_amount)
  }
  })

  const sortedKeys = moneyMap.keys().toArray()
  .sort((a, b) => {
    const [monthA, yearA] = a.split("/").map(x => parseInt(x));
    const [monthB, yearB] = b.split("/").map(x => parseInt(x));
    
    // First compare years, then months
    if (yearA !== yearB) {
      return yearA! - yearB!;
    }
    return monthA! - monthB!;
  });

  while (sortedKeys.length > 5) {
    sortedKeys.shift()
  }

  const lineChartData = sortedKeys.map((key, i) => {
    return {date: key, index: i, spending: Math.floor(moneyMap.get(key)!), fill: "var(--chart-1)"}
  });

     const chartConfig = {
     spending: {
       label: "Spending",
       color: "var(--chart-2)",
     },
   } satisfies ChartConfig;

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto p-4 space-y-6">
          <Card className="flex flex-col mt-5 mb-3">
            <Linechart data={lineChartData} config={chartConfig} />
          </Card>
          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Transaction Data</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
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
              <CustomPieChartByCategory
                data={chartData2}
                texts={{
                  title: "Transactions per Booking Type",
                  description: "Total amount (converted to CHF)",
                  visitorLabel: "CHF",
                  footerText: "",
                  footerSubText:
                    "Showing total transaction amounts in CHF per booking type",
                }}
              />
              <CustomPieChartByCategory
                data={chartDataIO}
                texts={{
                  title: "Incoming vs Outgoing",
                  description: "Total amount (converted to CHF)",
                  visitorLabel: "CHF",
                  footerText: "",
                  footerSubText: "Showing total incoming vs outgoing transactions",
                }}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
              <Infobox title="Total Spent" description="The total amount that you have spent" value="9999CHF" />
              <Infobox title="Total Earned" description="The total amount that you have earned" value="5CHF" />
              <Infobox title="Monthly Subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" />
          </CardContent>
          </Card>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Table View</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
              <OverviewTable/>
            </CardContent>
          </Card>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Map</CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="w-full h-[100%] min-h-[400px]">
                <PaymentsMap
                  payments={[]}
                  apiKey={process.env.GOOGLE_MAPS_API_KEY!}
                />
              </div>
            </CardContent>
          </Card>


        </div>
        {/* <div className=" mx-auto p-4 space-y-6">
          <PaymentsMap payments={[]} apiKey={process.env.GOOGLE_MAPS_API_KEY!} />
        </div> */}
        
      </SidebarInset>
    </SidebarProvider>
  )
}