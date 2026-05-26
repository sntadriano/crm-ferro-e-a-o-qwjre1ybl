import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Textarea } from '@/components/ui/textarea'

const schema = z.object({
  tipo: z.string(),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  resultado: z.string().optional(),
  data_contato: z.string().min(1, 'Data é obrigatória'),
  hora: z.string().optional(),
})

interface ContatoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId: string
  onSuccess?: () => void
}

export function ContatoFormDialog({
  open,
  onOpenChange,
  clienteId,
  onSuccess,
}: ContatoFormDialogProps) {
  const { user } = useAuth()

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'whatsapp',
      descricao: '',
      resultado: '',
      data_contato: new Date().toISOString().split('T')[0],
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        tipo: 'whatsapp',
        descricao: '',
        resultado: '',
        data_contato: new Date().toISOString().split('T')[0],
        hora: new Date().toTimeString().substring(0, 5),
      })
    }
  }, [open, form])

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const now = new Date()
      const isPast = new Date(data.data_contato + 'T00:00:00') < new Date(now.setHours(0, 0, 0, 0))

      await pb.collection('contatos').create({
        ...data,
        cliente_id: clienteId,
        usuario_id: user?.id,
        data_contato: new Date(`${data.data_contato}T${data.hora || '12:00'}:00`).toISOString(),
        status_validacao: isPast ? 'pendente' : 'aprovado',
      })
      toast.success('Contato registrado com sucesso')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao registrar contato')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Contato</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contato</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visita">Visita</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="data_contato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da conversa..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="resultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado (Opcional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visitado_com_sucesso">Visitado com sucesso</SelectItem>
                      <SelectItem value="tentou_nao_encontrou">Não encontrou</SelectItem>
                      <SelectItem value="recusou_atendimento">Recusou</SelectItem>
                      <SelectItem value="nao_estava">Não estava</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
