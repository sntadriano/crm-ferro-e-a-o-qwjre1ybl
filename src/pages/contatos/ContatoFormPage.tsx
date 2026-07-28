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
import { ClienteCombobox } from '@/components/contatos/ClienteCombobox'
import { RecordModel } from 'pocketbase'
import { format } from 'date-fns'

const formSchema = z
  .object({
    tipo: z.enum(['visita_presencial', 'telefone']),
    cliente_id: z.string().min(1, 'Selecione um cliente'),
    resultado: z.string().min(1, 'Selecione um resultado'),
    observacoes_resultado: z.string().optional(),
    descricao: z.string().optional(),
    data_contato: z.string().min(1, 'Data é obrigatória'),
    hora: z.string().min(1, 'Hora é obrigatória'),
    teve_pedido: z.boolean().default(false),
    valor_pedido: z.number().min(0).optional(),
    possivel_cliente: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.resultado === 'outro' && !data.observacoes_resultado) {
        return false
      }
      return true
    },
    {
      message: "Observações são obrigatórias quando o resultado for 'Outro'",
      path: ['observacoes_resultado'],
    },
  )

export default function ContatoFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [clientes, setClientes] = useState<RecordModel[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingClients, setFetchingClients] = useState(true)

  const defaultDate = format(new Date(), 'yyyy-MM-dd')
  const defaultTime = format(new Date(), 'HH:mm')

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: 'visita_presencial',
      cliente_id: '',
      resultado: '',
      observacoes_resultado: '',
      descricao: '',
      data_contato: defaultDate,
      hora: defaultTime,
      teve_pedido: false,
      possivel_cliente: false,
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
  const possivel_cliente = watch('possivel_cliente')
  const data_contato = watch('data_contato')
  const cliente_id = watch('cliente_id')

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        let filter = ''
        if (user?.role === 'vendedor') {
          filter = `vendedor = ${user?.codigo}`
        }
        const records = await pb.collection('clientes').getFullList({ sort: 'descricao', filter })
        setClientes(records)
      } catch (e) {
        toast.error('Erro ao carregar clientes.')
      } finally {
        setFetchingClients(false)
      }
    }
    fetchClientes()
  }, [user])

  const isPastDate = () => {
    if (!data_contato) return false
    const d = new Date(data_contato + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return d < today
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const isPast = isPastDate()
      const status_validacao = isPast ? 'pendente' : 'aprovado'

      await createContato({
        usuario_id: user?.id,
        cliente_id: values.cliente_id,
        tipo: values.tipo,
        resultado: values.resultado,
        observacoes_resultado: values.observacoes_resultado,
        descricao: values.descricao,
        data_contato: new Date(`${values.data_contato}T${values.hora}:00`).toISOString(),
        hora: values.hora,
        teve_pedido: values.teve_pedido,
        possivel_cliente: values.possivel_cliente,
        valor_pedido: values.teve_pedido ? values.valor_pedido : 0,
        status_validacao,
      })

      toast.success(
        isPast ? 'Registro criado e enviado para aprovação!' : 'Visita registrada com sucesso!',
      )
      navigate('/contatos')
    } catch (e: any) {
      console.error(e)
      toast.error('Erro ao registrar visita. Verifique os dados.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6 text-[#1A3A52]">Registrar Interação</h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow-subtle border"
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

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input type="date" {...register('data_contato')} />
              {errors.data_contato && (
                <p className="text-xs text-red-500">{errors.data_contato.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input type="time" {...register('hora')} />
              {errors.hora && <p className="text-xs text-red-500">{errors.hora.message}</p>}
            </div>
          </div>
        </div>

        {isPastDate() && (
          <p className="text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-200">
            Atenção: Este registro tem uma data anterior a hoje e exigirá aprovação da gerência.
          </p>
        )}

        <div className="space-y-2">
          <Label>Cliente</Label>
          {fetchingClients ? (
            <div className="h-10 w-full animate-pulse bg-gray-200 rounded-md" />
          ) : (
            <ClienteCombobox
              clientes={clientes}
              value={cliente_id}
              onChange={(v) => setValue('cliente_id', v, { shouldValidate: true })}
              loading={fetchingClients}
              onClienteCreated={(cliente) => {
                setClientes((prev) => [...prev, cliente])
              }}
            />
          )}
          {errors.cliente_id && <p className="text-xs text-red-500">{errors.cliente_id.message}</p>}
        </div>

        <div className="flex items-center gap-3 rounded-md border bg-emerald-50/60 p-3">
          <Checkbox
            id="possivel_cliente"
            checked={possivel_cliente}
            onCheckedChange={(c) => setValue('possivel_cliente', c as boolean)}
          />
          <Label
            htmlFor="possivel_cliente"
            className="cursor-pointer font-semibold text-emerald-800"
          >
            Possível Cliente
          </Label>
        </div>

        <div className="space-y-2">
          <Label>Resultado</Label>
          <Select onValueChange={(v) => setValue('resultado', v)} value={resultado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o resultado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="visitado_com_sucesso">Visitado / Contatado com sucesso</SelectItem>
              <SelectItem value="tentou_nao_encontrou">Tentou mas não encontrou</SelectItem>
              <SelectItem value="recusou_atendimento">Recusou atendimento</SelectItem>
              <SelectItem value="nao_estava">Não estava / Caixa postal</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.resultado && <p className="text-xs text-red-500">{errors.resultado.message}</p>}
        </div>

        {resultado === 'outro' && (
          <div className="space-y-2 animate-fade-in-up">
            <Label>
              Observações do Resultado <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...register('observacoes_resultado')}
              placeholder="Especifique o resultado..."
            />
            {errors.observacoes_resultado && (
              <p className="text-xs text-red-500">{errors.observacoes_resultado.message}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Descrição Adicional (Opcional)</Label>
          <Textarea {...register('descricao')} placeholder="Detalhes da conversa..." />
        </div>

        {tipo === 'visita_presencial' && (
          <div className="p-4 border rounded-md bg-[#F5F5F5] space-y-4 animate-fade-in-up">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="teve_pedido"
                checked={teve_pedido}
                onCheckedChange={(c) => setValue('teve_pedido', c as boolean)}
              />
              <Label htmlFor="teve_pedido" className="cursor-pointer">
                Houve fechamento de pedido?
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

        <Button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] bg-[#FFC107] text-[#1A3A52] hover:bg-[#e0a800] font-bold transition-all"
        >
          {loading ? 'Registrando...' : 'Salvar Registro'}
        </Button>
      </form>
    </div>
  )
}
