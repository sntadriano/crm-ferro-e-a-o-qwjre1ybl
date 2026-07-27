import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export const VENDEDOR_USERS_FILTER =
  "active = true && (role = 'vendedor' || role = 'julia' || role = 'admin')"

export const useVendedorUsers = () => {
  const [vendedorUsers, setVendedorUsers] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await pb.collection('users').getFullList({
        filter: VENDEDOR_USERS_FILTER,
        sort: 'name',
      })
      setVendedorUsers(data)
    } catch (e) {
      console.error('Failed to load vendedor users', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { vendedorUsers, loading }
}
