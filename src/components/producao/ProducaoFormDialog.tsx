import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { createProducao, updateProducao, ProducaoRecord } from '@/services/producao'
import { getActiveItensProducao, ItemProducao } from '@/services/itens-producao'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const schema = z.object({
  item_id: z.string().min(1, 'Selecione um item'),
  quantidade: z.coerce.number().min(0.01, 'Quantidade deve ser maior que 0'),
  data_producao: z.string().min(1, 'Data/Hora é obrigatória'),
  observacoes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record?: ProducaoRecord | null
}

export function ProducaoFormDialog({ open, onOpenChange, record }: Props) {
  const { user } = useAuth()
  const [items, setItems] = useState<ItemProducao[]>([])
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      item_id: '',
      quantidade: 0,
      data_producao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      observacoes: '',
    },
  })

  useEffect(() => {
    if (open) {
      getActiveItensProducao()
        .then(setItems)
        .catch(() => toast.error('Erro ao carregar itens'))
      if (record) {
        form.reset({
          item_id: record.item_id || '',
          quantidade: record.quantidade,
          data_producao: format(new Date(record.data_producao), "yyyy-MM-dd'T'HH:mm"),
          observacoes: record.observacoes || '',
        })
      } else {
        form.reset({
          item_id: '',
          quantidade: 0,
          data_producao: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
          observacoes: '',
        })
      }
    }
  }, [open, record, form])

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const selectedItem = items.find((i) => i.id === values.item_id)
      const data = {
        ...values,
        item: selectedItem?.nome || '',
        usuario_id: record ? record.usuario_id : user?.id,
        status: record ? record.status : 'registrado',
        ativo: true,
      }

      if (record) {
        await updateProducao(record.id, data)
        toast.success('Produção atualizada com sucesso')
      } else {
        await createProducao(data)
        toast.success('Produção registrada com sucesso')
      }
      onOpenChange(false)
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.entries(fieldErrors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast.error('Erro ao salvar produção')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{record ? 'Editar Produção' : 'Registrar Produção'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Produzido</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um item..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome} ({item.unidade})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_producao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data/Hora</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalhes adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {record && (
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                Última alteração em {format(new Date(record.updated), "dd/MM/yyyy 'às' HH:mm")}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
