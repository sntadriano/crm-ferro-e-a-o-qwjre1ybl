import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getVendedores, VendedorRecord } from '@/services/vendedores'
import { useAuth } from '@/hooks/use-auth'

interface VendedorContextType {
  vendedores: VendedorRecord[]
  getVendedorName: (codigo: number | string | undefined | null) => string
  loading: boolean
}

const VendedorContext = createContext<VendedorContextType | undefined>(undefined)

export const useVendedores = () => {
  const ctx = useContext(VendedorContext)
  if (!ctx) throw new Error('useVendedores must be used within VendedorProvider')
  return ctx
}

export const VendedorProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth()
  const [vendedores, setVendedores] = useState<VendedorRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await getVendedores()
      setVendedores(data)
    } catch (e) {
      console.error('Failed to load vendedores', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) load()
  }, [user, load])

  const getVendedorName = useCallback(
    (codigo: number | string | undefined | null): string => {
      if (codigo === undefined || codigo === null || codigo === '') return '-'
      const num = Number(codigo)
      if (!Number.isFinite(num)) return String(codigo)
      const found = vendedores.find((v) => v.codigo === num)
      return found ? found.nome : String(codigo)
    },
    [vendedores],
  )

  return (
    <VendedorContext.Provider value={{ vendedores, getVendedorName, loading }}>
      {children}
    </VendedorContext.Provider>
  )
}
