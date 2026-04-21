import React, { createContext, useContext, useState, useCallback } from 'react'
import { Customer } from '@/types/customer'
import { generateCode } from '@/lib/formatters'

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: 'CLI-10001',
    type: 'PJ',
    name: 'Ana Silva Soluções',
    tradeName: 'Ana Silva',
    document: '12.345.678/0001-90',
    stateRegistration: '201653702',
    status: 'Ativo',
    seller: 'Vendedor A',
    registeredAt: '2023-01-15',
    email: 'contato@anasilva.com.br',
    phone: '(11) 3333-4444',
    mobile: '(11) 99999-8888',
    address: {
      street: 'Rua A, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip: '01000-000',
    },
  },
  {
    id: '2',
    code: 'CLI-10002',
    type: 'PF',
    name: 'Carlos Oliveira',
    tradeName: 'Carlos Oliveira',
    document: '123.456.789-00',
    stateRegistration: '106689622',
    status: 'Inativo',
    seller: 'Vendedor B',
    registeredAt: '2023-02-20',
    email: 'carlos@email.com',
    mobile: '(21) 98888-7777',
    address: {
      street: 'Av B, 456',
      neighborhood: 'Jardins',
      city: 'Rio de Janeiro',
      state: 'RJ',
      zip: '20000-000',
    },
  },
  {
    id: '3',
    code: 'CLI-10003',
    type: 'PJ',
    name: 'Mariana Santos Comércio',
    tradeName: 'Mariana Santos',
    document: '98.765.432/0001-10',
    stateRegistration: '107274981',
    status: 'Ativo',
    seller: 'Vendedor A',
    registeredAt: '2023-03-10',
    email: 'mariana@santos.com',
    mobile: '(31) 97777-6666',
    address: {
      street: 'Rua C, 789',
      neighborhood: 'Savassi',
      city: 'Belo Horizonte',
      state: 'MG',
      zip: '30000-000',
    },
  },
  {
    id: '4',
    code: 'CLI-10004',
    type: 'PF',
    name: 'Roberto Costa',
    tradeName: 'Roberto Costa',
    document: '456.789.123-11',
    status: 'Ativo',
    seller: 'Vendedor C',
    registeredAt: '2023-04-05',
    email: 'roberto@costa.com',
    mobile: '(41) 96666-5555',
    address: {
      street: 'Rua D, 321',
      neighborhood: 'Batel',
      city: 'Curitiba',
      state: 'PR',
      zip: '80000-000',
    },
  },
  {
    id: '5',
    code: 'CLI-10005',
    type: 'PJ',
    name: 'Juliana Lima ME',
    tradeName: 'Juliana Lima',
    document: '11.222.333/0001-44',
    status: 'Inativo',
    seller: 'Vendedor B',
    registeredAt: '2023-05-12',
    email: 'juliana@lima.com',
    mobile: '(51) 95555-4444',
    address: {
      street: 'Av E, 654',
      neighborhood: 'Moinhos',
      city: 'Porto Alegre',
      state: 'RS',
      zip: '90000-000',
    },
  },
]

interface CustomerContextType {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, 'id' | 'code' | 'registeredAt'>) => void
  importCustomers: (count: number) => void
  getCustomer: (id: string) => Customer | undefined
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined)

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS)

  const addCustomer = useCallback((data: Omit<Customer, 'id' | 'code' | 'registeredAt'>) => {
    const newCustomer: Customer = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      code: generateCode(),
      registeredAt: new Date().toISOString().split('T')[0],
    }
    setCustomers((prev) => [newCustomer, ...prev])
  }, [])

  const importCustomers = useCallback((count: number) => {
    const newCustomers = Array.from({ length: count }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: generateCode(),
      type: 'PJ' as const,
      name: `Empresa Importada ${i + 1}`,
      tradeName: `Importada ${i + 1}`,
      document: `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`,
      status: 'Ativo' as const,
      seller: 'Vendedor Automático',
      registeredAt: new Date().toISOString().split('T')[0],
      address: { street: '', neighborhood: '', city: '', state: '', zip: '' },
    }))
    setCustomers((prev) => [...newCustomers, ...prev])
  }, [])

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers])

  return (
    <CustomerContext.Provider value={{ customers, addCustomer, importCustomers, getCustomer }}>
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomers must be used within a CustomerProvider')
  return context
}
