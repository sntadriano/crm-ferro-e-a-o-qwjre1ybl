import { Link, useLocation } from 'react-router-dom'
import { Users, Settings, Target, History, LogOut, BarChart, PieChart } from 'lucide-react'
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
  useSidebar,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

const items = [
  { title: 'Dashboard', url: '/dashboard', icon: BarChart },
  { title: 'Relatórios', url: '/relatorios', icon: PieChart, roles: ['admin', 'julia', 'gerente'] },
  { title: 'Clientes', url: '/clientes', icon: Users },
  {
    title: 'Histórico de Contatos',
    url: '/contatos',
    icon: History,
    roles: ['admin', 'julia', 'vendedor'],
  },
  {
    title: 'Registrar Contato',
    url: '/contatos/novo',
    icon: Target,
    roles: ['admin', 'julia', 'vendedor'],
  },
  {
    title: 'Aprovações',
    url: '/contatos/aprovacoes',
    icon: History,
    roles: ['admin', 'julia', 'gerente'],
  },
  {
    title: 'Relatório de Vendas',
    url: '/relatorios/vendas',
    icon: PieChart,
    roles: ['admin', 'julia', 'vendedor', 'gerente'],
  },
  { title: 'Leads', url: '/leads', icon: Target, roles: ['admin', 'julia', 'vendedor'] },
  { title: 'Administração', url: '/admin', icon: Settings, roles: ['admin'] },
  { title: 'Auditoria', url: '/auditoria', icon: History, roles: ['admin', 'julia', 'gerente'] },
]

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { setOpenMobile, isMobile } = useSidebar()

  const userName = user?.name || user?.email || 'Usuário'

  return (
    <Sidebar variant="inset" className="border-r-0 [&>[data-sidebar=sidebar]]:bg-[#1A3A52]">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 font-bold text-xl text-white line-clamp-1">
            <div className="bg-[#4A90E2] text-white p-1.5 rounded-md flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <span className="truncate">Ferro e Aço Eldorado</span>
          </div>
          <div className="text-sm font-medium text-white/90">Olá, {userName}</div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                let isAllowed = true
                if (item.roles) {
                  isAllowed = item.roles.includes(user?.role)
                  if (item.title === 'Aprovações' && user?.name?.toLowerCase().includes('alex')) {
                    isAllowed = true
                  }
                }

                if (!isAllowed) return null

                const isActive = location.pathname.startsWith(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={cn(
                        'h-12 text-[15px] font-medium text-white transition-colors duration-200 ease-in-out',
                        'hover:text-[#FFC107] hover:bg-transparent',
                        'data-[active=true]:bg-[#4A90E2] data-[active=true]:text-[#FFC107]',
                        'data-[active=true]:hover:bg-[#4A90E2] data-[active=true]:hover:text-[#FFC107]',
                        '[&>svg]:!w-[22px] [&>svg]:!h-[22px] [&>svg]:shrink-0',
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
              onClick={() => {
                if (isMobile) setOpenMobile(false)
                signOut()
              }}
              className={cn(
                'h-12 text-[15px] font-medium text-white transition-colors duration-200 ease-in-out',
                'hover:text-[#FFC107] hover:bg-transparent',
                '[&>svg]:!w-[22px] [&>svg]:!h-[22px] [&>svg]:shrink-0',
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
