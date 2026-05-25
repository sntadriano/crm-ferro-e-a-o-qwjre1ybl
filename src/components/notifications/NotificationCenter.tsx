import { useEffect, useState } from 'react'
import { Bell, Check, Trash2, Clock, AlertCircle } from 'lucide-react'
import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

import { getNotificacoes, markAsRead, markAllAsRead, clearRead } from '@/services/notificacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'

export function NotificationCenter() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notificacoes, setNotificacoes] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotificacoes = async () => {
    try {
      const res = await getNotificacoes()
      setNotificacoes(res.items)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role !== 'gerente') {
      loadNotificacoes()
    }
  }, [user])

  useRealtime(
    'notificacoes',
    () => {
      loadNotificacoes()
    },
    user?.role !== 'gerente',
  )

  if (user?.role === 'gerente') return null

  const unreadCount = notificacoes.filter((n) => n.status === 'nao_lida').length

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, status: 'lida' } : n)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user) return
    try {
      await markAllAsRead(user.id)
      loadNotificacoes()
    } catch (err) {
      console.error(err)
    }
  }

  const handleClearRead = async () => {
    if (!user) return
    try {
      await clearRead(user.id)
      loadNotificacoes()
    } catch (err) {
      console.error(err)
    }
  }

  const getTypeInfo = (tipo: string) => {
    switch (tipo) {
      case '1h_antes':
        return { label: 'Vence em 1h', color: 'text-yellow-600 bg-yellow-100', icon: Clock }
      case '24h_antes':
        return { label: 'Vence amanhã', color: 'text-green-600 bg-green-100', icon: Clock }
      case 'atrasado':
        return { label: 'Atrasado', color: 'text-red-600 bg-red-100', icon: AlertCircle }
      default:
        return { label: tipo, color: 'text-gray-600 bg-gray-100', icon: Bell }
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-primary-foreground hover:bg-primary-foreground/10"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {unreadCount} não lidas
              </Badge>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="flex-1 text-xs"
            >
              <Check className="mr-2 h-3 w-3" /> Marcar todas como lidas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearRead}
              className="flex-1 text-xs"
            >
              <Trash2 className="mr-2 h-3 w-3" /> Limpar lidas
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Todos os follow-ups em dia!</p>
            </div>
          ) : (
            <div className="space-y-1 py-4">
              {notificacoes.map((n) => {
                const info = getTypeInfo(n.tipo)
                const Icon = info.icon
                const leadName = n.expand?.lead_id?.expand?.cliente_id?.descricao || 'Lead Removido'

                return (
                  <div
                    key={n.id}
                    className={`p-3 rounded-lg flex items-start gap-3 transition-colors ${
                      n.status === 'nao_lida' ? 'bg-muted/50' : 'opacity-70'
                    }`}
                  >
                    <div className={`mt-1 p-2 rounded-full ${info.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-none">{leadName}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(n.created), 'dd/MM HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Status: <span className="font-semibold">{info.label}</span>
                      </p>
                      {n.status === 'nao_lida' && (
                        <button
                          onClick={() => handleMarkAsRead(n.id)}
                          className="text-xs text-primary font-medium hover:underline mt-2 block"
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
