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
    const category = trx.BUCHUNGS_ART_NAME || "Not specified";
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
          "--sidebar-width": "calc(var(--spacing) * 72)",
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
                  title: "Transactions per Booking Type",
                  description: "Total amount (converted to CHF)",
                  visitorLabel: "CHF",
                  footerText: "",
                  footerSubText:
                    "Showing total transaction amounts in CHF per booking type",
                }}
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

// "use server";

// import { AppSidebar } from "@/components/Shadcn/app-sidebar";
// import { SiteHeader } from "@/components/Shadcn/site-header";
// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/Shadcn/ui/sidebar";
// import { getAllDatapoints } from "@/server-actions/summary";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/Shadcn/ui/card";
// import { CustomPieChartByCategory } from "./custom-pie-chart";

// export default async function Page() {
//   const allTransactions = await getAllDatapoints();

//   if (!allTransactions.success || !allTransactions.data) {
//     return <div className="p-4">No data available</div>;
//   }

//   // Group by category (BUCHUNGS_ART_NAME) and TRX_CURRY_NAME
//   const categoryMap: Record<string, Record<string, number>> = {};

//   allTransactions.data.forEach((trx: any) => {
//     const category = trx.BUCHUNGS_ART_NAME || "Not specified";
//     const currency = trx.TRX_CURRY_NAME || "Unknown";
//     const amount = Number(trx.AMOUNT) || 0;

//     if (!categoryMap[category]) {
//       categoryMap[category] = {};
//     }
//     if (!categoryMap[category]![currency]) {
//       categoryMap[category]![currency] = 0;
//     }
//     categoryMap[category]![currency]! += amount;
//   });

//   const chartDataPerCategory = Object.entries(categoryMap).map(
//     ([category, currencies]) => ({
//       category,
//       data: Object.entries(currencies).map(([currency, total]) => ({
//         label: currency,
//         value: total,
//       })),
//     })
//   );

//   return (
//     <SidebarProvider
//       style={
//         {
//           "--sidebar-width": "calc(var(--spacing) * 72)",
//           "--header-height": "calc(var(--spacing) * 12)",
//         } as React.CSSProperties
//       }
//     >
//       <AppSidebar variant="inset" />
//       <SidebarInset>
//         <SiteHeader />
//         <div className="mx-auto p-4 space-y-6">
//           <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[400px]">
//             <CardHeader className="p-3 mb-3">
//               <CardTitle>Transactions per Booking Type</CardTitle>
//             </CardHeader>
//             <CardContent>
//               <div className="flex flex-wrap gap-6 justify-center">
//                 {chartDataPerCategory.map((entry) => (
//                   <div
//                     key={entry.category}
//                     className="flex-1 min-w-[300px] max-w-[500px]"
//                   >
//                     <CustomPieChartByCategory
//                       data={entry.data}
//                       texts={{
//                         title: entry.category,
//                         description: "Amounts grouped by currency",
//                         visitorLabel: "Amount",
//                         footerText: "",
//                         footerSubText: `Showing total transaction amounts for category "${entry.category}" split by currency`,
//                       }}
//                     />
//                   </div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </div>
//       </SidebarInset>
//     </SidebarProvider>
//   );
// }