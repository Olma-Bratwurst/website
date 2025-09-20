"use server";

import OverviewTable from "@/components/Custom/Tables/Overview/table-component";
import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import { Infobox } from "@/components/Custom/Infobox"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar"
import { Piechart } from "@/components/Custom/Piechart";
import { db } from "@/db";
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
import { CustomBarChartPerDay } from "./(public)/category/custom-bar-chart";
import { ChartBarMixed } from "./(public)/category/top-five-vendor";

function formatCHF(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

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
    if (trx?.DIRECTION !== 1) continue;
  
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
  const vendor = trx.TEXT_SHORT_DEBITOR?.trim();
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

// placeholder for subscriptions – adjust filtering logic later
// const monthlySubscriptions = allTransactions.data
//   .filter(trx => trx.CATEGORY === "Subscriptions") // or use TEXT_SHORT_DEBITOR matchers
//   .reduce((sum, trx) => sum + (Number(trx.AMOUNT_CHF) || 0), 0);
const monthlySubscriptions = 7900;


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
        <Card className="flex flex-col mb-3 sm:mr-3 overflow-hidden">
          <CardHeader className=" p-3 mb-3">
            <CardTitle>Transactions Statistics</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex-1 min-w-[300px] max-w-[500px]">
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
              </div>
              <div className="flex-1 min-w-[300px] max-w-[500px]">
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
              </div>
              <div className="flex-1 min-w-[300px] max-w-[500px]">
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
              </div>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
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

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Vendor</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full max-w-[500px]"> 
                <ChartBarMixed data={topVendors} />
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
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
              {/* <Infobox title="Total Spent" description="The total amount that you have spent" value="9999CHF" />
              <Infobox title="Total Earned" description="The total amount that you have earned" value="5CHF" />
              <Infobox title="Monthly Subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" /> */}
          </CardContent>
          </Card>

          <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden">
            <CardHeader className="p-3 mb-3">
              <CardTitle>Transaction Table View</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-6 justify-center">
              <OverviewTable/>
            </CardContent>
          </Card>

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
        
      </SidebarInset>
    </SidebarProvider>
  )
}