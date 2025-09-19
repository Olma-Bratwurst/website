import { Button } from "@/components/Shadcn/ui/button"
import { Separator } from "@/components/Shadcn/ui/separator"
import { SidebarTrigger } from "@/components/Shadcn/ui/sidebar"
import UserMenu from "../Custom/UserMenu"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <a
              href={`${process.env.NEXT_PUBLIC_BASE_URL}/`}
              rel="noopener noreferrer"
              // target="_blank"
              className="dark:text-foreground"
            >
        <h1 className="text-base font-medium">Olma Bratwurst</h1>
              
            </a>
        {/* <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div> */}
      </div>
    </header>
  )
}
