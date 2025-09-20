"use server";

import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import { Infobox } from "@/components/Custom/Infobox"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar"
import { Piechart } from "@/components/Custom/Piechart";
import { db } from "@/db";

export default async function Page() {
  const data = await db.transaction.findMany({
    orderBy: { TRX_DATE: "desc" },
    take: 500,
    skip: 0,
  });

  let incoming = 0;
  let outgoing = 0;

  data.forEach((dataPoint) => {
    if (dataPoint.DIRECTION && dataPoint.AMOUNT) {
      if (dataPoint.DIRECTION === 1) {
        outgoing += dataPoint.AMOUNT!;
      }
      if (dataPoint.DIRECTION === 2) {
        incoming += dataPoint.AMOUNT!;
      }
    }
  })

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
        <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
          <Piechart chartData={[
            { category: "incoming", spending: incoming, fill: "#ffff00" },
            { category: "outgoing", spending: outgoing, fill: "#00ffff" }
          ]} chartConfig={{ spending: { label: "Amount" }, incoming: { label: "Incoming", color: "#ffff00" }, outgoing: { label: "Outgoing", color: "#00ffff" } }} />
          <div className="flex flex-row justify-center space-x-6">
            <Infobox title="Total spent" description="The total amount that you have spent" value="9999CHF" />
            <Infobox title="Total earned" description="The total amount that you have earned" value="5CHF" />
            <Infobox title="Monthly subscriptions" description="Monthly cost of recognized subscription services" value="50CHF" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
