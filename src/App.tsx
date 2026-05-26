import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CustomerProvider } from '@/hooks/use-customers'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import DashboardPage from './pages/DashboardPage'
import CustomerListPage from './pages/customers/CustomerListPage'
import CustomerFormPage from './pages/customers/CustomerFormPage'
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage'
import LeadListPage from './pages/leads/LeadListPage'
import ContatoListPage from './pages/contatos/ContatoListPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/admin/AdminPage'
import RelatoriosPage from './pages/relatorios/RelatoriosPage'
import AuditPage from './pages/admin/AuditPage'
import ContatoFormPage from './pages/contatos/ContatoFormPage'
import ValidacaoPage from './pages/contatos/ValidacaoPage'
import VendasReportPage from './pages/relatorios/VendasReportPage'
import ItensProducaoPage from './pages/producao/ItensProducaoPage'
import ProducaoPage from './pages/producao/ProducaoPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()
  if (loading) return <div>Carregando...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <AuthProvider>
      <TooltipProvider>
        <CustomerProvider>
          <Toaster />
          <Sonner richColors closeButton />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
              <Route path="/producao" element={<ProducaoPage />} />
              <Route path="/producao/itens" element={<ItensProducaoPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CustomerProvider>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
