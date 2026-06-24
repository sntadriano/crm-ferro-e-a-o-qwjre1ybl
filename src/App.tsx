import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CustomerProvider } from '@/hooks/use-customers'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from './components/Layout'

const NotFound = lazy(() => import('./pages/NotFound'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CustomerListPage = lazy(() => import('./pages/customers/CustomerListPage'))
const CustomerFormPage = lazy(() => import('./pages/customers/CustomerFormPage'))
const CustomerDetailsPage = lazy(() => import('./pages/customers/CustomerDetailsPage'))
const LeadListPage = lazy(() => import('./pages/leads/LeadListPage'))
const ContatoListPage = lazy(() => import('./pages/contatos/ContatoListPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))
const RelatoriosPage = lazy(() => import('./pages/relatorios/RelatoriosPage'))
const AuditPage = lazy(() => import('./pages/admin/AuditPage'))
const ContatoFormPage = lazy(() => import('./pages/contatos/ContatoFormPage'))
const ValidacaoPage = lazy(() => import('./pages/contatos/ValidacaoPage'))
const VendasReportPage = lazy(() => import('./pages/relatorios/VendasReportPage'))
const ProducaoModulePage = lazy(() => import('./pages/producao/ProducaoModulePage'))

const LoadingFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
    </div>
  </div>
)

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, signOut } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.active === false) {
    signOut()
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const RootRedirect = () => {
  const { user } = useAuth()
  if (['julia', 'paulo'].includes(user?.role) || user?.email === 'soaresclaudio@gmail.com') {
    return <Navigate to="/producao" replace />
  }
  return <Navigate to="/dashboard" replace />
}

const RestrictedLayout = () => {
  const { user } = useAuth()
  if (['julia', 'paulo'].includes(user?.role) || user?.email === 'soaresclaudio@gmail.com') {
    return <Navigate to="/producao" replace />
  }
  return <Outlet />
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <CustomerProvider>
          <Toaster />
          <Sonner richColors closeButton />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<RootRedirect />} />

                <Route element={<RestrictedLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/clientes" element={<CustomerListPage />} />
                  <Route path="/clientes/novo" element={<CustomerFormPage />} />
                  <Route path="/clientes/:id" element={<CustomerDetailsPage />} />
                  <Route path="/leads" element={<LeadListPage />} />
                  <Route path="/contatos" element={<ContatoListPage />} />
                  <Route path="/contatos/novo" element={<ContatoFormPage />} />
                  <Route path="/validacao" element={<ValidacaoPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/relatorios" element={<RelatoriosPage />} />
                  <Route path="/relatorios/vendas" element={<VendasReportPage />} />
                  <Route path="/auditoria" element={<AuditPage />} />
                </Route>

                <Route path="/producao" element={<ProducaoModulePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </CustomerProvider>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
