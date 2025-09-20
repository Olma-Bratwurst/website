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
import { getAllDatapoints, getAllDatapoints2 } from "@/server-actions/summary";
import { Transaction } from "@prisma/client";
import RecurringPaymentsCard from "@/components/Custom/RecurringPaymentsCard";
import PartnerAds from "@/components/Custom/PartnerAds";
import BudgetPlannerWidget from "@/components/Custom/BudgetPlannerWidget";


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/Shadcn/ui/card";
import { CustomPieChartByCategory } from "./(public)/category/custom-pie-chart";
import { CustomBarChartPerDay } from "./(public)/category/custom-bar-chart";
import { ChartBarMixed } from "./(public)/category/top-five-vendor-by-amount";

function formatCHF(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
import { Linechart } from "@/components/Custom/Linechart";
import { ChartConfig } from "@/components/Shadcn/ui/chart";

export default async function Page() {
  // const data = await db.transaction.findMany({
  //   orderBy: { TRX_DATE: "desc" },
  //   take: 500,
  //   skip: 0,
  // });
  const allTransactions = await getAllDatapoints();
  const allTransactions2 = await getAllDatapoints2();

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


  ////////////////////////////////// TRANSACTIONS PER DAY ////////////////////////////////// 
  function toISODateKey(input: unknown): string | null {
    if (!input) return null;
  
    // If it's already a Date
    if (input instanceof Date && !isNaN(input.getTime())) {
      const y = input.getFullYear();
      const m = String(input.getMonth() + 1).padStart(2, "0");
      const d = String(input.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  
    const s = String(input).trim();
  
    // Try dd/MM/yyyy (also accepts dd.MM.yyyy and dd-MM-yyyy)
    const ddmmyyyy = s.replace(/[-.]/g, "/").match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (ddmmyyyy) {
      const day = Number(ddmmyyyy[1]), month = Number(ddmmyyyy[2]), year = Number(ddmmyyyy[3]);
      const dt = new Date(year, month - 1, day);
      if (!isNaN(dt.getTime())) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  
    // Try yyyy-MM-dd
    const ymd = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (ymd) {
      const year = Number(ymd[1]), month = Number(ymd[2]), day = Number(ymd[3]);
      const dt = new Date(year, month - 1, day);
      if (!isNaN(dt.getTime())) {
        return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      }
    }
  
    return null; // bad/unknown format
  }
  
  const txs = allTransactions?.data ?? [];
  const dailyTotals: Record<string, number> = {};
  
  for (const trx of txs) {
    if (trx?.AMOUNT_CHF == null) continue;
    // Uncomment to count only spending (outgoing):
    if (trx?.DIRECTION === 1) continue;
  
    const key = toISODateKey(trx?.TRX_DATE ?? trx?.VAL_DATE);
    if (!key) continue;
  
    dailyTotals[key] = (dailyTotals[key] ?? 0) + Number(trx.AMOUNT_CHF);
  }
  
  const chartData3 = Object.entries(dailyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({ label: date, value: Number(total.toFixed(2)) }));

    // console.log(chartData3)


  // --- TOP FIVE VENDORS ---
  // const vendorTotals: Record<string, number> = {};

  // allTransactions.data.forEach((trx: Transaction) => {
  //   const vendor = trx.TEXT_SHORT_DEBITOR?.trim();
  //   const amountChf = Number(trx.AMOUNT_CHF) || 0;

  //   if (!vendor || vendor === "Unknown Vendor") return; // skip missing ones

  //   vendorTotals[vendor] = (vendorTotals[vendor] ?? 0) + amountChf;
  // });

  // // sort by total desc and take top 5
  // const topVendors = Object.entries(vendorTotals)
  //   .sort((a, b) => b[1] - a[1])
  //   .slice(0, 5)
  //   .map(([vendor, total]) => ({ vendor, total }));

  const vendorTotals: Record<string, number> = {};

allTransactions.data.forEach((trx: Transaction) => {
  const vendor = trx.POINT_OF_SALE_AND_LOCATION?.trim();
  const amountChf = Number(trx.AMOUNT_CHF) || 0;

  if (!vendor || vendor === "Unknown Vendor") return; // skip missing ones

  vendorTotals[vendor] = (vendorTotals[vendor] ?? 0) + amountChf;
});

// sort by total desc and take top 5
const topVendors = Object.entries(vendorTotals)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([vendor, total], idx) => ({
    browser: vendor, // <-- maps to YAxis dataKey="browser"
    visitors: Number(total.toFixed(2)), // <-- maps to XAxis/Bar dataKey="visitors"
    fill: `var(--chart-${(idx % 5) + 1})`, // give each bar a color
  }));




  // --- TOP FIVE VENDORS BY FREQUENCY ---
const vendorCounts: Record<string, number> = {};

allTransactions.data.forEach((trx: Transaction) => {
  const vendor = trx.POINT_OF_SALE_AND_LOCATION?.trim();

  if (!vendor || vendor === "Unknown Vendor") return; // skip missing ones

  vendorCounts[vendor] = (vendorCounts[vendor] ?? 0) + 1;
});

// sort by frequency desc and take top 5
const topVendorsByFrequency = Object.entries(vendorCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([vendor, count], idx) => ({
    browser: vendor, // <-- maps to YAxis dataKey="browser"
    visitors: count, // <-- frequency
    fill: `var(--chart-${(idx % 5) + 1})`, // color
  }));



  ////////// INFO BOXES ///////////
  let totalSpent = 0;
let totalEarned = 0;

allTransactions.data.forEach((trx: Transaction) => {
  const amount = Number(trx.AMOUNT_CHF) || 0;
  if (!trx.DIRECTION) return;

  if (trx.DIRECTION === 1) {
    // outgoing
    totalSpent += amount;
  } else if (trx.DIRECTION === 2) {
    // incoming
    totalEarned += amount;
  }
});

const monthlySubscriptions = 7915.80;

  const demoItems = [
  {
    title: "To FRATELLI, ST. GALLEN",
    amount: -15.8,
    currency: "CHF",
    payments: [
      { date: "2025-08-07", amount: -15.8 },
      { date: "2025-06-03", amount: -15.8 },
      { date: "2025-05-13", amount: -15.8 },
    ],
  },
  {
    title: "SALAERZAHLUNG",
    amount: +7900,
    currency: "CHF",
    payments: [
      { date: "2025-08-22", amount: +7900 },
      { date: "2025-07-22", amount: +7900 },
      { date: "2025-06-20", amount: +7900 },
    ],
  },
];

  let moneyMap = new Map<string, number>();
allTransactions2.data.forEach((trx: Transaction) => {
  if (trx.TRX_DATE && trx.AMOUNT && trx.DIRECTION) {
    let monthKeyArr = trx.TRX_DATE!.split("/");
    monthKeyArr.shift();
    let monthKey = monthKeyArr.join("/");

    if (!Array.from(moneyMap.keys()).some((key) => key === monthKey)) {
      moneyMap.set(monthKey, 0);
    }

    let new_amount = trx.DIRECTION === 1 ? -trx.AMOUNT! : trx.AMOUNT!;
    moneyMap.set(monthKey, moneyMap.get(monthKey)! + new_amount);
  }
});

const sortedKeys = Array.from(moneyMap.keys()).sort((a, b) => {
  const [monthAStr, yearAStr] = a.split("/");
  const [monthBStr, yearBStr] = b.split("/");

  const monthA = parseInt(monthAStr ?? "0", 10);
  const yearA = parseInt(yearAStr ?? "0", 10);
  const monthB = parseInt(monthBStr ?? "0", 10);
  const yearB = parseInt(yearBStr ?? "0", 10);

  if (yearA !== yearB) return yearA - yearB;
  return monthA - monthB;
});


  while (sortedKeys.length > 5) {
    sortedKeys.shift()
  }

  const lineChartData = sortedKeys.map((key, i) => {
    return { date: key, index: i, spending: Math.floor(moneyMap.get(key)!), fill: "var(--chart-1)" }
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
          "--sidebar-width": "calc(var(--spacing) * 42)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <Card className="flex flex-col mb-2 sm:mr-3 overflow-hidden">
          <CardHeader className="p-3 pb-0"> 
            <CardTitle>Transactions Statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-wrap gap-4 justify-center">
  <div className="flex-1 min-w-[300px] max-w-[560px] h-80">
                <CustomPieChartByCategory
                  data={chartData}
                  texts={{
                    title: "Transactions per Category",
                    description: "Total amount (converted to CHF)",
                    visitorLabel: "CHF",

                  }}
                />
              </div>
              <div className="flex-1 min-w-[300px] max-w-[500px]">
                <CustomPieChartByCategory
                  data={chartData2}
                  texts={{
                    title: "Transactions per Booking Type",
                    description: "Total amount (converted to CHF)",
                    visitorLabel: "CHF",

                  }}
                />
              </div>
              <div className="flex-1 min-w-[300px] max-w-[500px]">
                <CustomPieChartByCategory
                  data={chartDataIO}
                  texts={{
                    title: "Incoming vs Outgoing",
                    description: "Total amount (converted to CHF)",
                    visitorLabel: "CHF",

                  }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              <div className="flex-1 w-full">
              <CustomBarChartPerDay
                data={chartData3}
                texts={{
                  title: "Amount Spent Per Day",
                  description: "Converted to CHF",
                  chartLabel: "Total Amount Spent",
                }}
              />

              </div>
            </div>
          </CardContent>
        </Card>



        <Card className="flex flex-col mb-3 sm:mr-3 overflow-hidden">
          <CardHeader className="p-3 pb-0"> 
            <CardTitle>Insights</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex-1 min-w-[300px] max-w-[500px]">
                {/* <Linechart data={lineChartData} config={chartConfig} /> */}

                <Card className="flex flex-col mb-3 sm:mr-3 overflow-hidden">
                  <CardHeader className=" p-3 mb-3">
                    <CardTitle>Account Balance Delta</CardTitle>
                    <CardDescription>Last 5 months</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 overflow-hidden">
                    <div className="flex flex-wrap gap-4 justify-center">
                      <div className="flex-1 min-w-[300px] max-w-[500px]">
                        <Linechart data={lineChartData} config={chartConfig} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

              </div>
              {/* <div className="flex-1 min-w-[300px] max-w-[500px]">
                <ChartBarMixed data={topVendors} title="Top vendors by volume" />
              </div>
              <div className="flex-1 min-w-[300px] max-w-[500px]">
              </div> */}
              <div className="flex-1 min-w-[300px] max-w-[500px]">
                <ChartBarMixed
                  data={topVendors}
                  title="Top 5 Vendors by Amount Spent"
                  description="All Time"
                  footer="Showing top five vendors by spending"
                />
              </div>

              <div className="flex-1 min-w-[300px] max-w-[500px]">
                <ChartBarMixed
                  data={topVendorsByFrequency}
                  title="Top 5 Vendors by Frequency"
                  description="All Time"
                  footer="Showing top five vendors by frequency"
                />
              </div>
            </div>
            {/* <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex-1 w-full">
              </div>
            </div> */}
          </CardContent>
        </Card>

        <div className="mx-auto p-4 space-y-6">
          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 pb-0"> 
              <CardTitle>First Glance</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
              {/* <ChartBarMixed data={topVendors} /> */}

              <Infobox
                title="Total Spent"
                description="The total amount that you have spent"
                value={`${formatCHF(totalSpent)} CHF`}
              />
              <Infobox
                title="Total Earned"
                description="The total amount that you have earned"
                value={`${formatCHF(totalEarned)} CHF`}
              />
              <Infobox
                title="Monthly Subscriptions"
                description="Monthly cost of recognized subscription services"
                value={`${formatCHF(monthlySubscriptions)} CHF`}
              />
              <RecurringPaymentsCard items={demoItems} />

              {/* <Infobox title="Total Spent" description="The total amount that you have spent" value="9999CHF" />
              <Infobox title="Total Earned" description="The total amount that you have earned" value="5CHF" />
              <Infobox title="Monthly Subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" /> */}
          </CardContent>
          </Card>

          <RecurringPaymentsCard items={demoItems} />
          <div className="p-4">
            <BudgetPlannerWidget currency="CHF" />
          </div>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Transaction Map</CardTitle>
            </CardHeader>
            <CardContent className="p-6 flex-1">
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
          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Transaction Table View</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
              <OverviewTable />
            </CardContent>
          </Card>
              <div>
                {/* existing content */}
                <PartnerAds />
              </div>
        
      </SidebarInset>
    </SidebarProvider>
  )
}
