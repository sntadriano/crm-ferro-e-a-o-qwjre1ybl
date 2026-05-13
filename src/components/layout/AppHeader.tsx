import { useLocation } from 'react-router-dom'
import { Bell, User } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function AppHeader() {
  const location = useLocation()

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(Boolean)
    if (paths.length === 0) return [{ label: 'Dashboard', isLast: true }]

    return paths.map((path, index) => {
      const isLast = index === paths.length - 1
      const label = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ')
      return {
        label: label === 'Novo' ? 'Novo Cliente' : label,
        isLast,
        url: '/' + paths.slice(0, index + 1).join('/'),
      }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-primary px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger
          className="-ml-2 text-primary-foreground"
          aria-label="Alternar menu lateral"
        />
        <Separator orientation="vertical" className="h-4 mr-2 bg-primary-foreground/20" />

        <div className="hidden md:flex items-center mr-4 pr-4 border-r border-primary-foreground/20">
          <span className="font-bold text-primary-foreground text-lg tracking-tight">
            Ferro e Aço Eldorado
          </span>
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage className="text-primary-foreground font-semibold">
                      {crumb.label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href={crumb.url}
                      className="text-primary-foreground/70 hover:text-primary-foreground"
                    >
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator className="text-primary-foreground/50" />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary-foreground/10"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20"
          aria-label="Perfil do usuário"
        >
          <User className="h-5 w-5 text-primary-foreground" />
        </Button>
      </div>
    </header>
  )
}
