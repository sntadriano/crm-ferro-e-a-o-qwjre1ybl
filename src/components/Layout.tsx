import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex w-full flex-col overflow-hidden min-h-screen">
        {/* Header Mobile */}
        <header className="md:hidden flex h-16 items-center gap-4 border-b bg-card px-4 shrink-0">
          <SidebarTrigger className="-ml-2 h-10 w-10 [&>span>svg]:h-6 [&>span>svg]:w-6" />
          <h1 className="text-lg font-bold text-primary">Ferro e Aço Eldorado</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-background">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
