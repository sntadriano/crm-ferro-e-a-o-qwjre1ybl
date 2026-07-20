import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
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
import { createCliente } from '@/services/clientes'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { useAuth } from '@/hooks/use-auth'

const schema = z.object({
  fantasia: z.string().min(1, 'Nome Fantasia é obrigatório'),
  descricao: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  fone: z.string().optional(),
  endereco: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface QuickCreateClienteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName?: string
  onCreated: (cliente: any) => void
}

export function QuickCreateClienteDialog({
  open,
  onOpenChange,
  initialName,
  onCreated,
}: QuickCreateClienteDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fantasia: '',
      descricao: '',
      cnpj_cpf: '',
      fone: '',
      endereco: '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        fantasia: initialName || '',
        descricao: '',
        cnpj_cpf: '',
        fone: '',
        endereco: '',
      })
    }
  }, [open, initialName, form])

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true)
    try {
      const payload: any = {
        fantasia: values.fantasia,
        descricao: values.descricao || values.fantasia,
        cnpj_cpf: values.cnpj_cpf || '',
        fone: values.fone || '',
        endereco: values.endereco || '',
        tipo: 'PJ',
        status: 'Prospecção',
        vendedor: user?.codigo ?? 0,
        cadastro: new Date().toISOString(),
      }
      const created = await createCliente(payload)
      toast.success('Cliente potencial cadastrado com sucesso!')
      onCreated(created)
    } catch (err) {
      const errors = extractFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        Object.entries(errors).forEach(([field, msg]) => {
          form.setError(field as any, { message: msg })
        })
      } else {
        toast.error('Erro ao cadastrar cliente. Verifique os dados.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Cliente Potencial</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fantasia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome Fantasia <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nome fantasia do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razão Social (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Razão social" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cnpj_cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ/CPF (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="(00) 0000-0000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endereco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Endereço do cliente" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </span>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
