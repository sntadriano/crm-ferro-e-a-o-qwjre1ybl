import React, { createContext, useContext, useState, useCallback } from 'react'
import { Customer } from '@/types/customer'
import { generateCode } from '@/lib/formatters'

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: '61352',
    type: 'PJ',
    name: '3B LTDA',
    tradeName: 'CASA NOVA',
    document: '55.802.463/0001-69',
    stateRegistration: '201653702',
    status: 'Ativo',
    seller: 'Vendedor 4',
    registeredAt: '2024-07-25',
    email: 'ana@email.com',
    mobile: '(62) 99219-1668',
    address: {
      street: 'AV.JUCELINO K. DE OLIV. Q4 L1 SALA5',
      neighborhood: 'CENTRO',
      city: 'ABADIANIA',
      state: 'GO',
      zip: '72940-000',
    },
  },
  {
    id: '2',
    code: '5037',
    type: 'PJ',
    name: '58672942 SILVANA SANTANA DIAS MIRANDA',
    tradeName: 'COM. RIBEIRO MAT. P/ CONSTRUCAO',
    document: '58.672.942/0001-04',
    stateRegistration: '202214702',
    status: 'Ativo',
    seller: 'Vendedor 2',
    registeredAt: '2012-03-05',
    email: 'carlos@email.com',
    mobile: '(62) 99272-1489',
    address: {
      street: 'AV. ALMIRO DE AMORIM QD.10 LT.04',
      neighborhood: 'CONJ. FILOSTRO MACHADO',
      city: 'ANAPOLIS',
      state: 'GO',
      zip: '75091-050',
    },
  },
  {
    id: '3',
    code: '23051',
    type: 'PJ',
    name: 'A C DA SILVA FERRAGISTA - ME',
    tradeName: 'FERRAGISTA BORJAO',
    document: '25.318.988/0001-62',
    stateRegistration: '106689622',
    status: 'Inativo',
    seller: 'Vendedor 2',
    registeredAt: '2017-01-23',
    email: 'mariana@email.com',
    mobile: '(62) 99176-4177',
    address: {
      street: 'RUA 25 QD.28 LT.39 SL.02',
      neighborhood: 'PARQUE RESIDENCIAL DAS FL',
      city: 'ANAPOLIS',
      state: 'GO',
      zip: '75085-560',
    },
  },
  {
    id: '4',
    code: '99001',
    type: 'PF',
    name: 'Roberto Alves da Costa',
    tradeName: 'Roberto Costa',
    document: '123.456.789-00',
    stateRegistration: 'ISENTO',
    status: 'Ativo',
    seller: 'Vendedor 1',
    registeredAt: '2023-11-10',
    email: 'roberto@email.com',
    mobile: '(11) 98888-7777',
    address: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Jardins',
      city: 'São Paulo',
      state: 'SP',
      zip: '01400-000',
    },
  },
  {
    id: '5',
    code: '99002',
    type: 'PJ',
    name: 'Tech Solutions Comércio LTDA',
    tradeName: 'Tech Store',
    document: '44.555.666/0001-77',
    stateRegistration: '30111222',
    status: 'Inativo',
    seller: 'Vendedor 3',
    registeredAt: '2022-05-20',
    email: 'contato@techsol.com',
    mobile: '(11) 94444-3333',
    address: {
      street: 'Av Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zip: '01310-100',
    },
  },
]

interface CustomerContextType {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, 'id' | 'code' | 'registeredAt'>) => void
  importCustomers: (created: number, updated: number) => void
  getCustomer: (id: string) => Customer | undefined
  checkDuplicateDocument: (document: string) => boolean
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

  const importCustomers = useCallback((created: number, updated: number) => {
    const newCustomers = Array.from({ length: created }).map((_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      code: generateCode(),
      type: 'PJ' as const,
      name: `Empresa Importada ${Date.now() + i}`,
      tradeName: `Importada ${i + 1}`,
      document: `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`,
      stateRegistration: 'ISENTO',
      status: 'Ativo' as const,
      seller: 'Vendedor Automático',
      registeredAt: new Date().toISOString().split('T')[0],
      address: {
        street: 'Rua Desconhecida',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip: '00000-000',
      },
    }))
    setCustomers((prev) => [...newCustomers, ...prev])
  }, [])

  const getCustomer = useCallback((id: string) => customers.find((c) => c.id === id), [customers])

  const checkDuplicateDocument = useCallback(
    (document: string) => {
      const digits = document.replace(/\D/g, '')
      return customers.some((c) => c.document.replace(/\D/g, '') === digits)
    },
    [customers],
  )

  return (
    <CustomerContext.Provider
      value={{ customers, addCustomer, importCustomers, getCustomer, checkDuplicateDocument }}
    >
      {children}
    </CustomerContext.Provider>
  )
}

export function useCustomers() {
  const context = useContext(CustomerContext)
  if (!context) throw new Error('useCustomers must be used within a CustomerProvider')
  return context
}
