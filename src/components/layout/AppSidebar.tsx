import { Link, useLocation } from 'react-router-dom'
import { Users, LayoutDashboard, Settings, Target, History } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Clientes', url: '/clientes', icon: Users },
  {
    title: 'Histórico de Contatos',
    url: '/contatos',
    icon: History,
    roles: ['admin', 'julia', 'vendedor'],
  },
  { title: 'Leads', url: '/leads', icon: Target, roles: ['admin', 'julia', 'vendedor'] },
  { title: 'Configurações', url: '/admin', icon: Settings, roles: ['admin'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { user } = useAuth()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-bold text-lg text-primary">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Users className="h-5 w-5" />
          </div>
          <span>CRM Plus</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                if (item.roles && !item.roles.includes(user?.role)) {
                  return null
                }

                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link to={item.url} aria-label={item.title}>
                        <item.icon aria-hidden="true" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
