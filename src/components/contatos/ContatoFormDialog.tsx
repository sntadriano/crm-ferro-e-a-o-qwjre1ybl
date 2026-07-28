import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { RecordModel } from 'pocketbase'
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
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
import { ClienteCombobox } from '@/components/contatos/ClienteCombobox'
import { createContato, updateContato } from '@/services/contatos'
import { buildVendedorFilter } from '@/lib/vendedor-filter'

const schema = z
  .object({
    tipo: z.string(),
    cliente_id: z.string().optional(),
    nome_possivel_cliente: z.string().optional(),
    descricao: z.string().min(1, 'Descrição é obrigatória'),
    resultado: z.string().optional(),
    data_contato: z.string().min(1, 'Data é obrigatória'),
    hora: z.string().optional(),
    possivel_cliente: z.boolean().default(false),
  })
  .refine((data) => {
    if (data.possivel_cliente) {
      if (!data.nome_possivel_cliente || data.nome_possivel_cliente.trim() === '') {
        return false
      }
    } else {
      if (!data.cliente_id || data.cliente_id === '') {
        return false
      }
    }
    return true
  }, 'Dados do cliente inválidos')

interface ContatoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clienteId?: string
  contato?: RecordModel | null
  onSuccess?: () => void
}

export function ContatoFormDialog({
  open,
  onOpenChange,
  clienteId,
  contato,
  onSuccess,
}: ContatoFormDialogProps) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<RecordModel[]>([])
  const [fetchingClients, setFetchingClients] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'whatsapp',
      cliente_id: '',
      nome_possivel_cliente: '',
      descricao: '',
      resultado: '',
      data_contato: new Date().toISOString().split('T')[0],
      hora: new Date().toTimeString().substring(0, 5),
      possivel_cliente: false,
    },
  })

  const fetchClientes = async () => {
    setFetchingClients(true)
    try {
      const filter = buildVendedorFilter()
      const records = await pb.collection('clientes').getFullList({ sort: 'descricao', filter })
      setClientes(records)
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingClients(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchClientes()
      if (contato) {
        form.reset({
          tipo: contato.tipo || 'whatsapp',
          cliente_id: contato.cliente_id || '',
          nome_possivel_cliente: contato.nome_possivel_cliente || '',
          descricao: contato.descricao || '',
          resultado: contato.resultado || '',
          data_contato: contato.data_contato
            ? new Date(contato.data_contato).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          hora: contato.hora || new Date().toTimeString().substring(0, 5),
          possivel_cliente: !!contato.possivel_cliente,
        })
      } else {
        form.reset({
          tipo: 'whatsapp',
          cliente_id: clienteId || '',
          nome_possivel_cliente: '',
          descricao: '',
          resultado: '',
          data_contato: new Date().toISOString().split('T')[0],
          hora: new Date().toTimeString().substring(0, 5),
          possivel_cliente: false,
        })
      }
    }
  }, [open, contato, clienteId])

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const now = new Date()
      const isPast = new Date(data.data_contato + 'T00:00:00') < new Date(now.setHours(0, 0, 0, 0))
      const status_validacao = isPast ? 'pendente' : 'aprovado'

      const payload = {
        ...data,
        cliente_id: data.possivel_cliente ? '' : data.cliente_id,
        nome_possivel_cliente: data.possivel_cliente ? data.nome_possivel_cliente?.trim() : '',
        usuario_id: user?.id,
        data_contato: new Date(`${data.data_contato}T${data.hora || '12:00'}:00`).toISOString(),
        status_validacao,
        possivel_cliente: data.possivel_cliente,
      }

      if (contato) {
        await updateContato(contato.id, payload)
        toast.success('Contato atualizado com sucesso')
      } else {
        await createContato(payload)
        toast.success('Contato registrado com sucesso')
      }
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao salvar contato')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{contato ? 'Editar Contato' : 'Registrar Contato'}</DialogTitle>
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
                      <SelectItem value="visita_presencial">Visita Presencial</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visita">Outra Visita</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('possivel_cliente') ? (
              <FormField
                control={form.control}
                name="nome_possivel_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Possível Cliente</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o nome do possível cliente..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <ClienteCombobox
                        clientes={clientes}
                        value={field.value}
                        onChange={(v) => field.onChange(v)}
                        loading={fetchingClients}
                        onClienteCreated={(c) => setClientes((prev) => [...prev, c])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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

            <FormField
              control={form.control}
              name="possivel_cliente"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-3 rounded-md border bg-emerald-50/60 p-3">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(c) => field.onChange(c as boolean)}
                      />
                    </FormControl>
                    <div className="leading-none">
                      <FormLabel className="cursor-pointer font-semibold text-emerald-800">
                        Possível Cliente
                      </FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Marque se este contato tem potencial de se tornar cliente.
                      </p>
                    </div>
                  </div>
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
