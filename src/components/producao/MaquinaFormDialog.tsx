import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { createMaquina, updateMaquina, type Maquina } from '@/services/maquinas'
import { useToast } from '@/hooks/use-toast'
import { getErrorMessage, extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  tipo_categoria: z.string().optional(),
  status: z.boolean(),
})

type FormData = z.infer<typeof formSchema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  maquina: Maquina | null
  onSuccess: () => void
}

export function MaquinaFormDialog({ open, onOpenChange, maquina, onSuccess }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      tipo_categoria: '',
      status: true,
    },
  })

  useEffect(() => {
    if (open) {
      if (maquina) {
        form.reset({
          nome: maquina.nome,
          tipo_categoria: maquina.tipo_categoria || '',
          status: maquina.status,
        })
      } else {
        form.reset({
          nome: '',
          tipo_categoria: '',
          status: true,
        })
      }
    }
  }, [open, maquina, form])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      if (maquina) {
        await updateMaquina(maquina.id, data)
        toast({ title: 'Máquina/Processo atualizado com sucesso' })
      } else {
        await createMaquina(data)
        toast({ title: 'Máquina/Processo criado com sucesso' })
      }
      onSuccess()
    } catch (error) {
      const fieldErrors = extractFieldErrors(error)
      if (Object.keys(fieldErrors).length > 0) {
        Object.keys(fieldErrors).forEach((key) => {
          form.setError(key as keyof FormData, { message: fieldErrors[key] })
        })
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro ao salvar máquina/processo',
          description: getErrorMessage(error),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{maquina ? 'Editar Máquina/Processo' : 'Nova Máquina/Processo'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corte e Dobra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tipo_categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo/Categoria (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Laminação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Status Ativo</FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
