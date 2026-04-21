import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { CustomerProvider } from '@/hooks/use-customers'
import Layout from './components/Layout'
import NotFound from './pages/NotFound'
import DashboardPage from './pages/DashboardPage'
import CustomerListPage from './pages/customers/CustomerListPage'
import CustomerFormPage from './pages/customers/CustomerFormPage'
import CustomerDetailsPage from './pages/customers/CustomerDetailsPage'

const App = () => (
  <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
    <TooltipProvider>
      <CustomerProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/clientes" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<CustomerListPage />} />
            <Route path="/clientes/novo" element={<CustomerFormPage />} />
            <Route path="/clientes/:id" element={<CustomerDetailsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </CustomerProvider>
    </TooltipProvider>
  </BrowserRouter>
)

export default App
