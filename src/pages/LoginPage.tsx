import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import logoUrl from '@/assets/whatsapp-image-2026-06-17-at-09.00.12-1c7fd.jpeg'

const formSchema = z.object({
  email: z.string().min(1, 'E-mail obrigatório').email('Formato de e-mail inválido'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  rememberMe: z.boolean().default(false),
})

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      form.setValue('email', savedEmail)
      form.setValue('rememberMe', true)

      const timer = setTimeout(() => {
        form.setFocus('password')
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [form])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    const emailToUse = values.email.trim().toLowerCase()
    const { error } = await signIn(emailToUse, values.password)
    setIsLoading(false)

    if (error) {
      toast({
        title: 'Erro de Autenticação',
        description: 'Falha na autenticação. Verifique seu e-mail e senha.',
        variant: 'destructive',
      })
    } else {
      if (values.rememberMe) {
        localStorage.setItem('rememberedEmail', emailToUse)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      const user = pb.authStore.record
      if (user && user.active === false) {
        pb.authStore.clear()
        toast({
          title: 'Acesso Negado',
          description: 'Sua conta está inativa. Entre em contato com o administrador.',
          variant: 'destructive',
        })
        return
      }

      if (['paulo', 'julia'].includes(user?.role) || user?.email === 'soaresclaudio@gmail.com') {
        navigate('/producao')
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="flex items-center justify-center mb-2 bg-white p-3 rounded-xl border shadow-sm">
            <img src={logoUrl} alt="CRM FERRO E AÇO Logo" className="h-16 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">CRM FERRO E AÇO</CardTitle>
          <CardDescription>Acesse o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="email"
                          placeholder="exemplo@email.com"
                          className="pl-9 h-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="pl-9 h-10"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                      Lembrar login
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-10 text-base" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
