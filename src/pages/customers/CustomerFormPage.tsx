import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ArrowLeft, Save, Building, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Separator } from '@/components/ui/separator'

export default function CustomerFormPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addCustomer, checkDuplicateDocument } = useCustomers()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formSchema = z.object({
    type: z.enum(['PF', 'PJ']),
    name: z.string().min(3, 'Mínimo de 3 caracteres'),
    tradeName: z.string().min(1, 'Nome fantasia é obrigatório'),
    document: z.string().min(14, 'Documento inválido'),
    stateRegistration: z.string().min(1, 'Inscrição estadual é obrigatória'),
    phone: z.string().optional(),
    mobile: z.string().optional(),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    street: z.string().min(1, 'Rua é obrigatória'),
    neighborhood: z.string().min(1, 'Bairro é obrigatório'),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(2, 'UF é obrigatória').max(2, 'Apenas a sigla (ex: SP)'),
    zip: z.string().min(8, 'CEP inválido'),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'PJ',
      name: '',
      tradeName: '',
      document: '',
      stateRegistration: '',
      phone: '',
      mobile: '',
      email: '',
      street: '',
      neighborhood: '',
      city: '',
      state: '',
      zip: '',
    },
  })

  const customerType = form.watch('type')

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (checkDuplicateDocument(values.document)) {
      form.setError('document', {
        type: 'manual',
        message: 'Este CNPJ/CPF já está cadastrado no sistema.',
      })
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      addCustomer({
        type: values.type,
        name: values.name,
        tradeName: values.tradeName,
        document: values.document,
        stateRegistration: values.stateRegistration,
        phone: values.phone,
        mobile: values.mobile,
        email: values.email,
        status: 'Ativo',
        seller: 'Não atribuído',
        address: {
          street: values.street,
          neighborhood: values.neighborhood,
          city: values.city,
          state: values.state,
          zip: values.zip,
        },
      })
      toast({
        title: 'Cliente criado com sucesso!',
        description: `${values.name} foi adicionado à base.`,
      })
      setIsSubmitting(false)
      navigate('/clientes')
    }, 800)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-muted-foreground text-sm">
            Preencha os dados completos para cadastrar um novo cliente.
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Building className="h-5 w-5" /> Dados Principais
              </div>
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de Cliente</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(v) => {
                          field.onChange(v)
                          form.setValue('document', '')
                        }}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-slate-50 transition-colors w-full sm:w-auto">
                          <FormControl>
                            <RadioGroupItem value="PJ" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">
                            Pessoa Jurídica
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0 border p-3 rounded-md cursor-pointer hover:bg-slate-50 transition-colors w-full sm:w-auto">
                          <FormControl>
                            <RadioGroupItem value="PF" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer w-full">
                            Pessoa Física
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
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
                      <FormLabel>Nome Fantasia *</FormLabel>
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
                          onChange={(e) =>
                            field.onChange(formatDocument(e.target.value, customerType))
                          }
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
                      <FormLabel>Inscrição Estadual *</FormLabel>
                      <FormControl>
                        <Input placeholder="Apenas números ou ISENTO..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Phone className="h-5 w-5" /> Contato
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone Comercial</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 0000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mobile"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Celular</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 90000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="my-6" />
              <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <MapPin className="h-5 w-5" /> Endereço Completo
              </div>
              <div className="grid gap-6 md:grid-cols-12">
                <div className="md:col-span-4">
                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CEP *</FormLabel>
                        <FormControl>
                          <Input placeholder="00000-000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-8">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua / Logradouro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da rua, avenida..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-5">
                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome do bairro" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-5">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UF *</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} className="uppercase" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/clientes')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  <Save className="h-4 w-4" /> {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  )
}
