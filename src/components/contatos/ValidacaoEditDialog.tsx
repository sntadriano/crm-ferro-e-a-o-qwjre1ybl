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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { RecordModel } from 'pocketbase'

const schema = z.object({
  resultado: z.string().min(1, 'Resultado é obrigatório'),
  observacoes_resultado: z.string().optional(),
  teve_pedido: z.boolean().default(false),
  valor_pedido: z.number().optional(),
})

type ValidacaoFormValues = z.infer<typeof schema>

interface ValidacaoEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contato: RecordModel | null
  onSuccess?: () => void
}

export function ValidacaoEditDialog({
  open,
  onOpenChange,
  contato,
  onSuccess,
}: ValidacaoEditDialogProps) {
  const form = useForm<ValidacaoFormValues>({
    resolver: zodResolver(schema as any),
    defaultValues: {
      resultado: '',
      observacoes_resultado: '',
      teve_pedido: false,
      valor_pedido: 0,
    },
  })

  const tevePedido = form.watch('teve_pedido')

  useEffect(() => {
    if (open && contato) {
      form.reset({
        resultado: contato.resultado || '',
        observacoes_resultado: contato.observacoes_resultado || '',
        teve_pedido: contato.teve_pedido || false,
        valor_pedido: contato.valor_pedido || 0,
      })
    }
  }, [open, contato, form])

  const onSubmit = async (data: ValidacaoFormValues) => {
    if (!contato) return
    try {
      await pb.collection('contatos').update(contato.id, {
        resultado: data.resultado,
        observacoes_resultado: data.observacoes_resultado,
        teve_pedido: data.teve_pedido,
        valor_pedido: data.teve_pedido ? data.valor_pedido : 0,
      })
      toast.success('Registro atualizado com sucesso')
      onOpenChange(false)
      if (onSuccess) onSuccess()
    } catch (err) {
      toast.error('Erro ao atualizar registro')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Informações da Visita</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resultado</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o resultado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="visitado_com_sucesso">Visitado com sucesso</SelectItem>
                      <SelectItem value="tentou_nao_encontrou">Tentou mas não encontrou</SelectItem>
                      <SelectItem value="recusou_atendimento">Recusou atendimento</SelectItem>
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
              name="observacoes_resultado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações do Resultado</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes adicionais sobre o resultado..."
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
              name="teve_pedido"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Teve Pedido?</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {tevePedido && (
              <FormField
                control={form.control}
                name="valor_pedido"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Pedido (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
