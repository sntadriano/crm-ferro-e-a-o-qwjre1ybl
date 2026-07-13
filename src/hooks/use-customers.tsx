import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'

interface CustomerContextType {
  customers: any[]
  isLoading: boolean
  hasError: boolean
  fetchCustomers: () => void
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export const useCustomers = () => {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomers must be used within a CustomerProvider')
  return context
}

export const CustomerProvider = ({ children }: { children: ReactNode }) => {
  const [customers, setCustomers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const fetchCustomers = async () => {
    setIsLoading(true)
    setHasError(false)
    try {
      const records = await pb.collection('clientes').getFullList({
        sort: '-created',
        filter: '',
      })
      setCustomers(
        records.map((r) => ({
          id: r.id,
          name: r.descricao,
          tradeName: r.fantasia,
          document: r.cnpj_cpf,
          code: r.codigo,
          status: r.status || 'ativo',
          seller: r.vendedor?.toString(),
          registeredAt: r.cadastro || r.created,
          type: r.tipo === 'J' ? 'PJ' : 'PF',
          email: r.email,
          phone: r.fone,
          mobile: r.celular,
          contact: '',
          address: {
            street: r.endereco,
            neighborhood: r.bairro,
            city: r.cidade,
            state: r.uf,
            zip: r.cep,
          },
        })),
      )
    } catch (err) {
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [])

  useRealtime('clientes', () => {
    fetchCustomers()
  })

  return (
    <CustomerContext.Provider value={{ customers, isLoading, hasError, fetchCustomers }}>
      {children}
    </CustomerContext.Provider>
  )
}
