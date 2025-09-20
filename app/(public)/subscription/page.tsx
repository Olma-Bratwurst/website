"use server";

import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar"
import { getLastDatapoints } from "@/server-actions/summary";

export default async function Page() {

  const last10transcations = await getLastDatapoints();
  // console.log("last10transcations: ", last10transcations)

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
        Subscription
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            </div>
          </div>
        </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}