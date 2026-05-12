import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

export default function Layout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const isAdmin = user?.role === 'admin'

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/clientes', icon: Users, label: 'Clientes' },
    ...(isAdmin ? [{ to: '/admin', icon: Settings, label: 'Administração' }] : []),
  ]

  const NavLinks = () => (
    <>
      {links.map((link) => {
        const Icon = link.icon
        const isActive = location.pathname.startsWith(link.to)
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{link.label}</span>
          </Link>
        )
      })}
    </>
  )

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r bg-card">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-primary">Eldorado CRM</h1>
          <p className="text-sm text-muted-foreground mt-1">Olá, {user?.name || user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <NavLinks />
        </nav>
        <div className="p-4 border-t">
          <Button variant="ghost" className="w-full justify-start gap-3" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Mobile */}
        <header className="md:hidden flex items-center justify-between p-4 border-b bg-card">
          <h1 className="text-xl font-bold text-primary">Eldorado CRM</h1>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 flex flex-col">
              <div className="p-6 border-b">
                <p className="text-sm text-muted-foreground">Olá, {user?.name || user?.email}</p>
              </div>
              <nav className="flex-1 p-4 space-y-2">
                <NavLinks />
              </nav>
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
