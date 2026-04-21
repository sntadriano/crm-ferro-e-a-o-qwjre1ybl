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
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-2" />
        <Separator orientation="vertical" className="h-4 mr-2" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.url}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {!crumb.isLast && <BreadcrumbSeparator />}
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted">
          <User className="h-5 w-5 text-muted-foreground" />
        </Button>
      </div>
    </header>
  )
}
