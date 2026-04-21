import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './layout/AppSidebar'
import { AppHeader } from './layout/AppHeader'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen bg-slate-50/50 dark:bg-background">
        <AppHeader />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden animate-fade-in-up">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
