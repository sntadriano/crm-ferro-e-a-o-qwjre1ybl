import React, { createContext, useContext, useState, useCallback } from 'react'
import { Customer } from '@/types/customer'
import { generateCode } from '@/lib/formatters'

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    code: 'CLI-1001',
    type: 'PF',
    name: 'Ana Silva',
    tradeName: 'Ana Silva',
    document: '111.222.333-44',
    stateRegistration: 'ISENTO',
    status: 'Ativo',
    seller: 'Vendedor 1',
    registeredAt: '2024-01-15',
    email: 'ana.silva@email.com',
    mobile: '(11) 99999-1111',
    address: {
      street: 'Rua das Flores, 123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip: '01000-000',
    },
  },
  {
    id: '2',
    code: 'CLI-1002',
    type: 'PF',
    name: 'Carlos Oliveira',
    tradeName: 'Carlos Oliveira',
    document: '222.333.444-55',
    stateRegistration: 'ISENTO',
    status: 'Ativo',
    seller: 'Vendedor 2',
    registeredAt: '2024-02-20',
    email: 'carlos.oliveira@email.com',
    mobile: '(11) 98888-2222',
    address: {
      street: 'Avenida Paulista, 1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zip: '01310-100',
    },
  },
  {
    id: '3',
    code: 'CLI-1003',
    type: 'PF',
    name: 'Mariana Santos',
    tradeName: 'Mariana Santos',
    document: '333.444.555-66',
    stateRegistration: 'ISENTO',
    status: 'Inativo',
    seller: 'Vendedor 1',
    registeredAt: '2024-03-10',
    email: 'mariana.santos@email.com',
    mobile: '(11) 97777-3333',
    address: {
      street: 'Rua Augusta, 500',
      neighborhood: 'Consolação',
      city: 'São Paulo',
      state: 'SP',
      zip: '01305-000',
    },
  },
]

export interface ProcessImportStats {
  total: number
  processed: number
  created: number
  updated: number
  duplicates: number
  errors: number
}

interface CustomerContextType {
  customers: Customer[]
  addCustomer: (customer: Omit<Customer, 'id' | 'code' | 'registeredAt'>) => void
  processImport: (
    rows: Omit<Customer, 'id'>[],
    onProgress: (stats: ProcessImportStats, warning?: string) => void,
  ) => Promise<ProcessImportStats>
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

  const processImport = useCallback(
    async (
      rows: Omit<Customer, 'id'>[],
      onProgress: (stats: ProcessImportStats, warning?: string) => void,
    ) => {
      const CHUNK_SIZE = 50
      let currentIndex = 0

      const stats: ProcessImportStats = {
        total: rows.length,
        processed: 0,
        created: 0,
        updated: 0,
        duplicates: 0,
        errors: 0,
      }

      const processedDocuments = new Set<string>()

      return new Promise<ProcessImportStats>((resolve) => {
        const processNextChunk = () => {
          let warningMessage = ''

          setCustomers((prev) => {
            const nextCustomers = [...prev]
            const end = Math.min(currentIndex + CHUNK_SIZE, rows.length)

            for (let i = currentIndex; i < end; i++) {
              const row = rows[i]
              stats.processed++

              if (!row.document) {
                stats.errors++
                continue
              }

              const docDigits = row.document.replace(/\D/g, '')

              if (processedDocuments.has(docDigits)) {
                stats.duplicates++
                warningMessage = `Cliente ${row.name || row.document} duplicado no arquivo, pulando linha...`
                continue
              }

              processedDocuments.add(docDigits)

              const existingIndex = nextCustomers.findIndex(
                (c) => c.document.replace(/\D/g, '') === docDigits,
              )

              if (existingIndex >= 0) {
                nextCustomers[existingIndex] = {
                  ...nextCustomers[existingIndex],
                  ...row,
                  id: nextCustomers[existingIndex].id,
                }
                stats.updated++
              } else {
                nextCustomers.unshift({
                  ...row,
                  id: Math.random().toString(36).substr(2, 9),
                })
                stats.created++
              }
            }

            return nextCustomers
          })

          currentIndex += CHUNK_SIZE

          onProgress({ ...stats }, warningMessage || undefined)

          if (currentIndex < rows.length) {
            requestAnimationFrame(processNextChunk)
          } else {
            resolve(stats)
          }
        }

        requestAnimationFrame(processNextChunk)
      })
    },
    [],
  )

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
      value={{ customers, addCustomer, processImport, getCustomer, checkDuplicateDocument }}
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
