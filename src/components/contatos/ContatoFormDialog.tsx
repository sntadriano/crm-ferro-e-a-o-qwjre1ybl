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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { createContato, updateContato } from '@/services/contatos'
import { getClientes } from '@/services/clientes'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

const schema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  data_contato: z.string().min(1, 'Data é obrigatória'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  resultado: z.string().optional(),
})

interface ContatoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contato?: RecordModel | null
  initialClienteId?: string
}

export function ContatoFormDialog({
  open,
  onOpenChange,
  contato,
  initialClienteId,
}: ContatoFormDialogProps) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<RecordModel[]>([])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: '',
      tipo: 'whatsapp',
      data_contato: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      descricao: '',
      resultado: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (contato) {
        const d = new Date(contato.data_contato)
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
        const formattedDate = d.toISOString().slice(0, 16)

        form.reset({
          cliente_id: contato.cliente_id,
          tipo: contato.tipo || 'whatsapp',
          data_contato: formattedDate,
          descricao: contato.descricao || '',
          resultado: contato.resultado || '',
        })
      } else {
        form.reset({
          cliente_id: initialClienteId || '',
          tipo: 'whatsapp',
          data_contato: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          descricao: '',
          resultado: '',
        })
      }
      fetchClientes()
    }
  }, [open, contato, initialClienteId])

  const fetchClientes = async () => {
    try {
      const data = await getClientes()
      setClientes(data.items)
    } catch (err) {
      console.error(err)
    }
  }

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      const payload = {
        ...data,
        data_contato: new Date(data.data_contato).toISOString(),
        usuario_id: contato ? undefined : user?.id,
      }

      if (contato) {
        await updateContato(contato.id, payload)
        toast.success('Contato atualizado com sucesso', {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <Check className="h-4 w-4 text-green-600" />,
        })
      } else {
        await createContato(payload)
        toast.success('Contato registrado com sucesso', {
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: <Check className="h-4 w-4 text-green-600" />,
        })
      }
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast.error('Erro ao salvar contato')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-[#1A3A52]">
            {contato ? 'Editar Contato' : 'Novo Contato'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Cliente <span className="text-destructive">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between min-h-[44px]',
                            !field.value && 'text-muted-foreground',
                          )}
                          disabled={!!contato || !!initialClienteId}
                        >
                          {field.value
                            ? clientes.find((c) => c.id === field.value)?.descricao ||
                              'Cliente selecionado'
                            : 'Selecione o cliente'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[450px] p-0">
                      <Command>
                        <CommandInput placeholder="Buscar cliente..." />
                        <CommandList>
                          <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                          <CommandGroup>
                            {clientes.map((c) => (
                              <CommandItem
                                key={c.id}
                                value={c.descricao}
                                onSelect={() => {
                                  form.setValue('cliente_id', c.id)
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    c.id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {c.descricao}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="min-h-[44px]">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="visita">Visita</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_contato"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Data e Hora <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="datetime-local" className="min-h-[44px]" {...field} />
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
                  <FormLabel>
                    Descrição <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes da conversa ou visita..."
                      className="min-h-[100px]"
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
                  <FormLabel>Resultado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="min-h-[44px]">
                        <SelectValue placeholder="Selecione o desfecho..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="sucesso">Sucesso</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="sem resposta">Sem resposta</SelectItem>
                      <SelectItem value="não interessado">Não interessado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 space-x-3">
              <Button
                type="button"
                onClick={() => onOpenChange(false)}
                className="min-h-[44px] bg-[#4A90E2] text-white hover:bg-[#3A7BC8] font-bold px-6"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-h-[44px] bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold px-6"
              >
                {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Contato'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
