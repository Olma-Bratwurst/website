"use server";

import { AppSidebar } from "@/components/Shadcn/app-sidebar";
import { SiteHeader } from "@/components/Shadcn/site-header";
import { Infobox } from "@/components/Custom/Infobox"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/Shadcn/ui/sidebar"
import { Piechart } from "@/components/Custom/Piechart";

export default async function Page() {
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
          <Piechart />
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
