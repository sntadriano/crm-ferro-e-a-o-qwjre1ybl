import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import pb from '@/lib/pocketbase/client'
import { useIsMobile } from '@/hooks/use-mobile'
import { toast } from '@/hooks/use-toast'

interface AuthContextType {
  user: any
  loading: boolean
  signIn: (e: string, p: string) => Promise<{ error: any }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(pb.authStore.record)
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  const lastActivityRef = useRef(Date.now())
  const warningShownRef = useRef(false)

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record)
    })
    setLoading(false)
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
        pb.authStore.clear()
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
      await pb.collection('users').authWithPassword(email, password)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signOut = () => {
    pb.authStore.clear()
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
