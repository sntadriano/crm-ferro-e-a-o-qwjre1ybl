import { Link, useLocation } from 'react-router-dom'
import logoUrl from '@/assets/whatsapp-image-2026-06-17-at-09.00.12-1c7fd.jpeg'
import {
  Users,
  Settings,
  Target,
  History,
  LogOut,
  BarChart,
  PieChart,
  Package,
  Factory,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
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
    title: 'Validação',
    url: '/validacao',
    icon: ShieldCheck,
    roles: ['admin', 'julia', 'gerente'],
  },
  {
    title: 'Relatório de Vendas',
    url: '/relatorios/vendas',
    icon: TrendingUp,
    roles: ['admin', 'julia', 'vendedor', 'gerente'],
  },
  { title: 'Leads', url: '/leads', icon: Target, roles: ['admin', 'julia', 'vendedor'] },
  { title: 'Administração', url: '/admin', icon: Settings, roles: ['admin'] },
  { title: 'Pedidos & Produtos', url: '/pedidos', icon: Package, roles: ['admin'] },
  { title: 'Auditoria', url: '/auditoria', icon: History, roles: ['admin', 'julia', 'gerente'] },
  {
    title: 'Produção',
    url: '/producao',
    icon: Factory,
    roles: ['admin', 'julia', 'gerente', 'paulo', 'gerente_producao'],
  },
]

export function AppSidebar() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { setOpenMobile, isMobile } = useSidebar()

  const userName = user?.name || user?.email || 'Usuário'

  return (
    <Sidebar variant="inset" className="border-r-0">
      <SidebarHeader className="p-4 border-b border-white/10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center bg-white p-2 rounded-lg">
            <img src={logoUrl} alt="CRM FERRO E AÇO Logo" className="h-16 object-contain" />
          </div>
          <div className="text-sm font-medium text-sidebar-foreground">Olá, {userName}</div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                let isAllowed = true
                if (
                  ['julia', 'paulo', 'gerente_producao'].includes(user?.role) ||
                  user?.email === 'soaresclaudio@gmail.com'
                ) {
                  isAllowed = item.title === 'Produção'
                } else if (item.roles) {
                  isAllowed = item.roles.includes(user?.role)
                  if (
                    (item.title === 'Aprovações' || item.title === 'Histórico de Produção') &&
                    user?.name?.toLowerCase().includes('alex')
                  ) {
                    isAllowed = true
                  }
                }

                if (!isAllowed) return null

                const hasChildItem = items.some(
                  (other) => other.url !== item.url && other.url.startsWith(item.url + '/'),
                )
                const isActive = hasChildItem
                  ? location.pathname === item.url
                  : location.pathname === item.url || location.pathname.startsWith(item.url + '/')
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => isMobile && setOpenMobile(false)}
                      className={cn(
                        'h-12 text-[15px] font-medium text-sidebar-foreground transition-colors duration-200 ease-in-out',
                        'hover:text-sidebar-primary hover:bg-transparent',
                        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary',
                        'data-[active=true]:hover:bg-sidebar-accent data-[active=true]:hover:text-sidebar-primary',
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
                'h-12 text-[15px] font-medium text-sidebar-foreground transition-colors duration-200 ease-in-out',
                'hover:text-sidebar-primary hover:bg-transparent',
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
