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
              <Piechart chartData={[
            { category: "incoming", spending: incoming, fill: "var(--chart-1)" },
            { category: "outgoing", spending: outgoing, fill: "var(--chart-2)" }
          ]} chartConfig={{ spending: { label: "Amount" }, incoming: { label: "Incoming ", color: "#ffff00" }, outgoing: { label: "Outgoing ", color: "#00ffff" } }} />
            </CardContent>
          </Card>
        </div>
        <div className=" mx-auto p-4 space-y-6">
          <div className="flex flex-row justify-center space-x-6">
            <Infobox title="Total spent" description="The total amount that you have spent" value="9999CHF" />
            <Infobox title="Total earned" description="The total amount that you have earned" value="5CHF" />
            <Infobox title="Monthly subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" />
          </div>
          <OverviewTable/>
          <PaymentsMap payments={[]} apiKey={process.env.GOOGLE_MAPS_API_KEY!} />
        </div>
        
      </SidebarInset>
    </SidebarProvider>
  )
}


// "use server";

// import OverviewTable from "@/components/Custom/Tables/Overview/table-component";
// import { AppSidebar } from "@/components/Shadcn/app-sidebar";
// import { SiteHeader } from "@/components/Shadcn/site-header";
// import { Infobox } from "@/components/Custom/Infobox"
// import {
//   SidebarInset,
//   SidebarProvider,
// } from "@/components/Shadcn/ui/sidebar"
// import { Piechart } from "@/components/Custom/Piechart";
// import { db } from "@/db";
// import { PaymentsMap } from "@/components/Custom/Map";
// import { getAllDatapoints } from "@/server-actions/summary";
// import { Transaction } from "@prisma/client";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/Shadcn/ui/card";
// import { CustomPieChartByCategory } from "./(public)/category/custom-pie-chart";

// export default async function Page() {
//   // const data = await db.transaction.findMany({
//   //   orderBy: { TRX_DATE: "desc" },
//   //   take: 500,
//   //   skip: 0,
//   // });
//   const allTransactions = await getAllDatapoints();

//   const locationSet = new Set<string>();
  

//   let incoming = 0;
//   let outgoing = 0;

//   allTransactions.data.forEach((dataPoint) => {
//     if (dataPoint.POINT_OF_SALE_AND_LOCATION) {
//       locationSet.add(dataPoint.POINT_OF_SALE_AND_LOCATION!);
//     }
//     if (dataPoint.DIRECTION && dataPoint.AMOUNT) {
//       if (dataPoint.DIRECTION === 1) {
//         outgoing += dataPoint.AMOUNT!;
//       }
//       if (dataPoint.DIRECTION === 2) {
//         incoming += dataPoint.AMOUNT!;
//       }
//     }
//   })

//   const chartDataIO = [
//     { label: "Incoming", value: incoming },
//     { label: "Outgoing", value: outgoing }
//   ];

//   ////////////////////////////////// CATEGORY ////////////////////////////////// 
//   if (!allTransactions.success || !allTransactions.data) {
//     return <div className="p-4">No data available</div>;
//   }

//   // Group by category and sum AMOUNT_CHF
//   const categoryTotals: Record<string, number> = {};

//   allTransactions.data.forEach((trx: Transaction) => {
//     const category = trx.CATEGORY || "Not specified";
//     const amountChf = Number(trx.AMOUNT_CHF) || 0;

//     if (!categoryTotals[category]) {
//       categoryTotals[category] = 0;
//     }
//     categoryTotals[category] += amountChf;
//   });

//   const chartData = Object.entries(categoryTotals).map(([category, total]) => ({
//     label: category,
//     value: total,
//   }));



//   ////////////////////////////////// BOOKING TYPE ////////////////////////////////// 
//   // Group by category and sum AMOUNT_CHF
//   const categoryTotals2: Record<string, number> = {};

//   allTransactions.data.forEach((trx: Transaction) => {
//     const category = trx.BUCHUNGS_ART_NAME || "Not specified";
//     const amountChf = Number(trx.AMOUNT_CHF) || 0;

//     if (!categoryTotals2[category]) {
//       categoryTotals2[category] = 0;
//     }
//     categoryTotals2[category] += amountChf;
//   });

//   const chartData2 = Object.entries(categoryTotals2).map(([category, total]) => ({
//     label: category,
//     value: total,
//   }));

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
//           <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
//             <CardHeader className="p-3 mb-3">
//               <CardTitle>Transaction Data</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-wrap gap-6 justify-center">
//               <CustomPieChartByCategory
//                 data={chartData}
//                 texts={{
//                   title: "Transactions per Category",
//                   description: "Total amount (converted to CHF)",
//                   visitorLabel: "CHF",
//                   footerText: "",
//                   footerSubText:
//                     "Showing total transaction amounts in CHF per category",
//                 }}
//               />
//               <CustomPieChartByCategory
//                 data={chartData2}
//                 texts={{
//                   title: "Transactions per Booking Type",
//                   description: "Total amount (converted to CHF)",
//                   visitorLabel: "CHF",
//                   footerText: "",
//                   footerSubText:
//                     "Showing total transaction amounts in CHF per booking type",
//                 }}
//               />
//               <CustomPieChartByCategory
//                 data={chartDataIO}
//                 texts={{
//                   title: "Incoming vs Outgoing",
//                   description: "Total amount (converted to CHF)",
//                   visitorLabel: "CHF",
//                   footerText: "",
//                   footerSubText: "Showing total incoming vs outgoing transactions",
//                 }}
//               />
//             </CardContent>
//           </Card>

//           <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
//             <CardHeader className="p-3 mb-3">
//               <CardTitle>Overview</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-wrap gap-6 justify-center">
//               <Infobox title="Total Spent" description="The total amount that you have spent" value="9999CHF" />
//               <Infobox title="Total Earned" description="The total amount that you have earned" value="5CHF" />
//               <Infobox title="Monthly Subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" />
//           </CardContent>
//           </Card>

//           <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
//             <CardHeader className="p-3 mb-3">
//               <CardTitle>Table View</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-wrap gap-6 justify-center">
//               <OverviewTable/>
//             </CardContent>
//           </Card>

//           <Card className="flex flex-col mt-5 mb-3 sm:mr-3 overflow-hidden h-[500px]">
//             <CardHeader className="p-3 mb-3">
//               <CardTitle>Map</CardTitle>
//             </CardHeader>
//             <CardContent className="flex flex-wrap gap-6 justify-center">
//               <PaymentsMap payments={[]} apiKey={process.env.GOOGLE_MAPS_API_KEY!} />
//             </CardContent>
//           </Card>

//         </div>
//         {/* <div className=" mx-auto p-4 space-y-6">
//           <PaymentsMap payments={[]} apiKey={process.env.GOOGLE_MAPS_API_KEY!} />
//         </div> */}
        
//       </SidebarInset>
//     </SidebarProvider>
//   )
// }
