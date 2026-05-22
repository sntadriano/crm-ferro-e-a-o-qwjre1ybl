import { Link, useLocation } from 'react-router-dom'
import { Users, Settings, Target, History, LogOut, BarChart } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart },
  { title: 'Clientes', url: '/clientes', icon: Users },
  {
    title: 'Histórico de Contatos',
    url: '/contatos',
    icon: History,
    roles: ['admin', 'julia', 'vendedor'],
  },
  { title: 'Leads', url: '/leads', icon: Target, roles: ['admin', 'julia', 'vendedor'] },
  { title: 'Administração', url: '/admin', icon: Settings, roles: ['admin'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const userName = user?.name || 'Usuário'

  return (
    <Sidebar variant="inset" className="border-r-0 [&>[data-sidebar=sidebar]]:bg-[#1A3A52]">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 font-bold text-xl text-white">
            <div className="bg-[#4A90E2] text-white p-1.5 rounded-md flex items-center justify-center">
              <Users className="h-6 w-6" />
            </div>
            <span>CRM Eldorado</span>
          </div>
          <div className="text-sm font-medium text-white/90">Olá, {userName} Eldorado</div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                if (item.roles && !item.roles.includes(user?.role)) {
                  return null
                }

                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={cn(
                        'h-11 text-[14px] text-white transition-colors duration-200 ease-in-out',
                        'hover:text-[#FFC107] hover:bg-transparent',
                        'data-[active=true]:bg-[#4A90E2] data-[active=true]:text-[#FFC107]',
                        'data-[active=true]:hover:bg-[#4A90E2] data-[active=true]:hover:text-[#FFC107]',
                        '[&>svg]:size-5 [&>svg]:shrink-0',
                      )}
                    >
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

      <SidebarFooter className="p-4 border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut()}
              className={cn(
                'h-11 text-[14px] text-white transition-colors duration-200 ease-in-out',
                'hover:text-[#FFC107] hover:bg-transparent',
                '[&>svg]:size-5 [&>svg]:shrink-0',
              )}
              aria-label="Sair do sistema"
            >
              <LogOut aria-hidden="true" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
