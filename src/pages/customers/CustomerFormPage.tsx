import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useCustomers } from '@/hooks/use-customers'
import { formatDocument } from '@/lib/formatters'

const formSchema = z
  .object({
    type: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
    tradeName: z.string().optional(),
    document: z.string().min(11, 'Documento inválido'),
    stateRegistration: z.string().optional(),
  })
  .refine(
    (data) => {
      const digits = data.document.replace(/\D/g, '')
      if (data.type === 'PF' && digits.length !== 11) return false
      if (data.type === 'PJ' && digits.length !== 14) return false
      return true
    },
    {
      message: 'Documento com formato ou quantidade de dígitos inválidos',
      path: ['document'],
    },
  )

export default function CustomerFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addCustomer } = useCustomers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'PJ',
      name: '',
      tradeName: '',
      document: '',
      stateRegistration: '',
    },
  })

  const customerType = form.watch('type')

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      addCustomer({
        type: values.type,
        name: values.name,
        tradeName: values.tradeName,
        document: values.document,
        stateRegistration: values.stateRegistration,
        status: 'Ativo',
        seller: 'Não atribuído',
        address: { street: '', neighborhood: '', city: '', state: '', zip: '' },
      })

      toast({
        title: 'Cliente criado com sucesso!',
        description: `${values.name} foi adicionado à base.`,
      })

      setIsSubmitting(false)
      navigate('/clientes')
    }, 800)
  }

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (v: string) => void,
  ) => {
    const formatted = formatDocument(e.target.value, customerType)
    onChange(formatted)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground text-sm">
            Preencha os dados abaixo para cadastrar um cliente.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Cliente</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => {
                          field.onChange(val)
                          form.setValue('document', '') // clear document when type changes
                        }}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                          <FormControl>
                            <RadioGroupItem value="PJ" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">
                            Pessoa Jurídica
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                          <FormControl>
                            <RadioGroupItem value="PF" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">
                            Pessoa Física
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {customerType === 'PJ' ? 'Razão Social' : 'Nome Completo'} *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tradeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {customerType === 'PJ' ? 'Nome Fantasia' : 'Apelido (Opcional)'}
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Digite o nome fantasia..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{customerType === 'PJ' ? 'CNPJ' : 'CPF'} *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            customerType === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'
                          }
                          value={field.value}
                          onChange={(e) => handleDocumentChange(e, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="stateRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inscrição Estadual (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Apenas números..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clientes')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
