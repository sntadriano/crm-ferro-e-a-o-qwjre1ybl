import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from '@/hooks/use-toast'

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (email: string, p: string) => Promise<{ error: any }>
  signOut: () => void
  requestPasswordReset: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // authStore.record survives JWT expiry — gate on authStore.isValid so
  // stale credentials in localStorage don't let expired sessions
  // through and cause 401s on the first authenticated fetch.
  const [user, setUser] = useState<any>(pb.authStore.isValid ? pb.authStore.record : null)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const lastActivityRef = useRef(Date.now())
  const warningShownRef = useRef(false)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(pb.authStore.isValid ? record : null)
    })

    // Refresh on boot; clear on failure (revoked/expired server-side).
    // Without this, a user whose JWT expired while the tab was closed
    // keeps a truthy `record` in localStorage and every authenticated
    // request fails with 401 — surfacing as empty lists / blank state.
    if (pb.authStore.isValid) {
      pb.collection('users')
        .authRefresh()
        .then(() => {
          setUser(pb.authStore.record)
        })
        .catch(() => {
          pb.authStore.clear()
          try {
            localStorage.removeItem('pocketbase_auth')
          } catch {
            /* intentionally ignored */
          }
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      if (pb.authStore.record) {
        pb.authStore.clear()
        try {
          localStorage.removeItem('pocketbase_auth')
        } catch {
          /* intentionally ignored */
        }
      }
      setUser(null)
      setLoading(false)
    }

    return () => {
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const INACTIVITY_LIMIT = isMobile ? 15 * 60 * 1000 : 30 * 60 * 1000
    const WARNING_TIME = 2 * 60 * 1000

    const updateActivity = () => {
      lastActivityRef.current = Date.now()
      warningShownRef.current = false
    }

    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((e) => window.addEventListener(e, updateActivity))

    const interval = setInterval(() => {
      const inactiveFor = Date.now() - lastActivityRef.current

      if (inactiveFor > INACTIVITY_LIMIT) {
        try {
          pb.authStore.clear()
          localStorage.removeItem('pocketbase_auth')
        } catch {
          /* intentionally ignored */
        }
        toast({
          title: 'Sessão expirada',
          description: 'Você foi desconectado por inatividade.',
          variant: 'destructive',
        })
      } else if (inactiveFor > INACTIVITY_LIMIT - WARNING_TIME && !warningShownRef.current) {
        warningShownRef.current = true
        toast({
          title: 'Aviso de inatividade',
          description:
            'Sua sessão irá expirar em 2 minutos. Movimente o mouse ou clique para continuar.',
          duration: 10000,
        })
      }
    }, 10000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, updateActivity))
      clearInterval(interval)
    }
  }, [user, isMobile])

  const signIn = async (email: string, password: string) => {
    try {
      await pb.collection('users').authWithPassword(email, password, {
        fetch: async (url: RequestInfo | URL, config?: RequestInit) => {
          const controller = new AbortController()
          const id = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout
          try {
            const res = await fetch(url, { ...config, signal: controller.signal })
            return res
          } finally {
            clearTimeout(id)
          }
        },
      })
      return { error: null }
    } catch (error: any) {
      console.warn('[Login Debug] authWithPassword failed:', error)
      if (error.name === 'AbortError') {
        return {
          error: { message: 'A conexão demorou muito para responder. Verifique sua internet.' },
        }
      }
      return { error }
    }
  }

  const signOut = () => {
    try {
      pb.authStore.clear()
      localStorage.removeItem('pocketbase_auth')
    } catch (e) {
      console.warn('[Auth] Erro ao limpar sessão:', e)
    }
  }

  const requestPasswordReset = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email)
      return { error: null }
    } catch (error: any) {
      console.warn('[Auth] requestPasswordReset failed:', error)
      return { error }
    }
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, requestPasswordReset, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
