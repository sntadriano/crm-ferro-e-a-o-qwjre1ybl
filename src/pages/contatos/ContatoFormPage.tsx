import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createContato } from '@/services/contatos'

const formSchema = z
  .object({
    tipo: z.enum(['visita_presencial', 'telefone']),
    cliente_id: z.string().min(1, 'Selecione um cliente'),
    resultado: z.string().min(1, 'Selecione um resultado'),
    descricao: z.string().optional(),
    data_contato: z.string().min(1, 'Data é obrigatória'),
    teve_pedido: z.boolean().default(false),
    valor_pedido: z.number().min(0).optional(),
  })
  .refine(
    (data) => {
      if (data.resultado === 'Outro' && !data.descricao) {
        return false
      }
      return true
    },
    {
      message: "Observações são obrigatórias quando o resultado for 'Outro'",
      path: ['descricao'],
    },
  )

export default function ContatoFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingClients, setFetchingClients] = useState(true)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'visita_presencial',
      cliente_id: '',
      resultado: '',
      descricao: '',
      data_contato: new Date().toISOString().slice(0, 16),
      teve_pedido: false,
      valor_pedido: 0,
    },
  })

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    register,
  } = form
  const tipo = watch('tipo')
  const resultado = watch('resultado')
  const teve_pedido = watch('teve_pedido')
  const data_contato = watch('data_contato')
  const cliente_id = watch('cliente_id')

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const records = await pb.collection('clientes').getFullList({ sort: 'descricao' })
        setClientes(records)
      } catch (e) {
        toast.error('Erro ao carregar clientes.')
      } finally {
        setFetchingClients(false)
      }
    }
    fetchClientes()
  }, [])

  const isPastDate = () => {
    if (!data_contato) return false
    const d = new Date(data_contato)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const isPast = isPastDate()
      const status_aprovacao = isPast ? 'pendente' : 'aprovado'

      await createContato({
        usuario_id: user?.id,
        cliente_id: values.cliente_id,
        tipo: values.tipo,
        resultado: values.resultado,
        descricao: values.descricao,
        data_contato: new Date(values.data_contato).toISOString().replace('T', ' '),
        teve_pedido: values.teve_pedido,
        valor_pedido: values.teve_pedido ? values.valor_pedido : 0,
        status_aprovacao,
      })

      toast.success(
        isPast ? 'Registro criado e enviado para aprovação!' : 'Visita registrada com sucesso!',
      )
      navigate('/contatos')
    } catch (e) {
      toast.error('Erro ao registrar visita. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Registrar Atividade</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white dark:bg-slate-900 p-6 rounded-lg shadow-sm border dark:border-slate-800"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Contato</Label>
            <Select onValueChange={(v: any) => setValue('tipo', v)} value={tipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="visita_presencial">Visita Presencial</SelectItem>
                <SelectItem value="telefone">Telefone</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data e Hora</Label>
            <Input type="datetime-local" {...register('data_contato')} />
            {isPastDate() && (
              <p className="text-xs text-amber-600 font-medium mt-1">
                Este registro exigirá aprovação da gerência.
              </p>
            )}
            {errors.data_contato && (
              <p className="text-xs text-red-500">{errors.data_contato.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Cliente</Label>
          {fetchingClients ? (
            <div className="h-10 w-full animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md" />
          ) : (
            <Select onValueChange={(v) => setValue('cliente_id', v)} value={cliente_id}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.descricao} - {c.cnpj_cpf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.cliente_id && <p className="text-xs text-red-500">{errors.cliente_id.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Resultado</Label>
          <Select onValueChange={(v) => setValue('resultado', v)} value={resultado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Visitado com sucesso">Visitado com sucesso</SelectItem>
              <SelectItem value="Tentou mas não encontrou">Tentou mas não encontrou</SelectItem>
              <SelectItem value="Recusou atendimento">Recusou atendimento</SelectItem>
              <SelectItem value="Não estava">Não estava</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.resultado && <p className="text-xs text-red-500">{errors.resultado.message}</p>}
        </div>

        {true && (
          <div className="space-y-2 animate-fade-in-up">
            <Label>
              Observações {resultado === 'Outro' && <span className="text-red-500">*</span>}
            </Label>
            <Textarea {...register('descricao')} placeholder="Detalhes do contato..." />
            {errors.descricao && <p className="text-xs text-red-500">{errors.descricao.message}</p>}
          </div>
        )}

        {tipo === 'visita_presencial' && (
          <div className="p-4 border rounded-md bg-gray-50 dark:bg-slate-800/50 space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teve_pedido"
                checked={teve_pedido}
                onCheckedChange={(c) => setValue('teve_pedido', c as boolean)}
              />
              <Label htmlFor="teve_pedido" className="cursor-pointer">
                Teve pedido?
              </Label>
            </div>

            {teve_pedido && (
              <div className="space-y-2 animate-fade-in-up">
                <Label>Valor do Pedido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  {...register('valor_pedido', { valueAsNumber: true })}
                />
                {errors.valor_pedido && (
                  <p className="text-xs text-red-500">{errors.valor_pedido.message}</p>
                )}
              </div>
            )}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full transition-all">
          {loading ? 'Registrando...' : 'Registrar'}
        </Button>
      </form>
    </div>
  )
}
