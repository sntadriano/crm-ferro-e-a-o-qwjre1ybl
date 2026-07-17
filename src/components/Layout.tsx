import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import logoUrl from '@/assets/whatsapp-image-2026-06-17-at-09.00.12-1c7fd.jpeg'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex w-full flex-col overflow-hidden min-h-screen">
        {/* Header Mobile */}
        <header className="md:hidden flex h-16 items-center justify-between border-b bg-primary px-4 shrink-0">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 h-10 w-10 text-primary-foreground hover:bg-primary/90 [&>span>svg]:h-6 [&>span>svg]:w-6" />
          </div>
          <div className="bg-white rounded-md p-1">
            <img src={logoUrl} alt="CRM FERRO E AÇO Logo" className="h-8 object-contain" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 pb-24 md:p-8 md:pb-12 bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
