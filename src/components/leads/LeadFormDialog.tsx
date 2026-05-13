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
import { createLead, updateLead } from '@/services/leads'
import { getClientes } from '@/services/clientes'
import { toast } from 'sonner'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'
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
import { cn } from '@/lib/utils'

const schema = z.object({
  cliente_id: z.string().min(1, 'Cliente é obrigatório'),
  status: z.string(),
  valor_estimado: z.coerce.number().min(0.01, 'Valor deve ser positivo'),
  proximo_followup: z.string().optional(),
})

interface LeadFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: RecordModel | null
}

export function LeadFormDialog({ open, onOpenChange, lead }: LeadFormDialogProps) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState<RecordModel[]>([])

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      cliente_id: '',
      status: 'novo',
      valor_estimado: 0,
      proximo_followup: '',
    },
  })

  useEffect(() => {
    if (open) {
      if (lead) {
        form.reset({
          cliente_id: lead.cliente_id,
          status: lead.status || 'novo',
          valor_estimado: lead.valor_estimado || 0,
          proximo_followup: lead.proximo_followup ? lead.proximo_followup.split(' ')[0] : '',
        })
      } else {
        form.reset({
          cliente_id: '',
          status: 'novo',
          valor_estimado: 0,
          proximo_followup: '',
        })
      }
      fetchClientes()
    }
  }, [open, lead])

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
        data_criacao: lead ? undefined : new Date().toISOString(),
        usuario_id: lead ? undefined : user?.id,
        proximo_followup: data.proximo_followup
          ? new Date(data.proximo_followup).toISOString()
          : '',
      }

      if (lead) {
        await updateLead(lead.id, payload)
        toast.success('Lead atualizado com sucesso')
      } else {
        await createLead(payload)
        toast.success('Lead criado com sucesso')
      }
      onOpenChange(false)
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast.error('Erro ao salvar lead')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{lead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="cliente_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Cliente</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between',
                            !field.value && 'text-muted-foreground',
                          )}
                          disabled={!!lead}
                        >
                          {field.value
                            ? clientes.find((c) => c.id === field.value)?.descricao ||
                              'Cliente selecionado'
                            : 'Selecione o cliente'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
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

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="proposta_enviada">Proposta Enviada</SelectItem>
                      <SelectItem value="fechado">Fechado</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="valor_estimado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Estimado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="proximo_followup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Próximo Follow-up</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end pt-4 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="min-h-[44px]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="min-h-[44px] bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
              >
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
