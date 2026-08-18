import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, User, AlertTriangle, Info } from 'lucide-react'
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
  username: z.string().min(1, 'Usuário obrigatório'),
  password: z.string().min(8, 'A senha deve ter no mínimo 8 caracteres.'),
  rememberMe: z.boolean().default(false),
})

const memoryStorage: Record<string, string> = {}
const safeStorage = {
  getItem: (key: string) => {
    try {
      return localStorage.getItem(key)
    } catch (e) {
      console.warn('[Storage] localStorage indisponível:', e)
      return memoryStorage[key] || null
    }
  },
  setItem: (key: string, val: string) => {
    try {
      localStorage.setItem(key, val)
    } catch (e) {
      console.warn('[Storage] localStorage indisponível:', e)
      memoryStorage[key] = val
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.warn('[Storage] localStorage indisponível:', e)
      delete memoryStorage[key]
    }
  },
}

const sanitizePassword = (raw: string): string =>
  String(raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [autofillDetected, setAutofillDetected] = useState(false)

  const passwordInputRef = useRef<HTMLInputElement | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: '', password: '', rememberMe: false },
    mode: 'onSubmit',
  })

  useEffect(() => {
    try {
      const savedUsername = safeStorage.getItem('rememberedUsername')
      if (savedUsername) {
        form.setValue('username', savedUsername, { shouldValidate: true, shouldDirty: true })
        form.setValue('rememberMe', true)

        const timer = setTimeout(() => {
          form.setFocus('password')
        }, 100)
        return () => clearTimeout(timer)
      }
    } catch (err) {
      console.warn('Storage fallback failed:', err)
    }
  }, [form])

  const checkCapsLock = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    try {
      const state = e.getModifierState && e.getModifierState('CapsLock')
      setCapsLockOn(!!state)
    } catch {
      /* noop */
    }
  }, [])

  const handleAutofillAnimation = useCallback((e: React.AnimationEvent<HTMLInputElement>) => {
    if (e.animationName.includes('onAutofillStart') || e.animationName === 'onAutoFillStart') {
      setAutofillDetected(true)
    } else if (e.animationName.includes('onAutofillCancel')) {
      setAutofillDetected(false)
    }
  }, [])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    const safeIdentity = String(values.username)
      .trim()
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
    const safePassword = sanitizePassword(values.password)

    try {
      pb.authStore.clear()
      safeStorage.removeItem('pocketbase_auth')
    } catch (e) {
      console.warn('[Login] Erro ao limpar sessão anterior', e)
    }

    const { error } = await signIn(safeIdentity, safePassword)
    setIsLoading(false)

    if (error) {
      let description = 'Usuário ou senha incorretos. Verifique seus dados e tente novamente.'
      const errObj = error as any

      if (errObj?.status === 400) {
        console.warn('[Login Error] Credenciais inválidas (400):', {
          status: errObj.status,
          data: errObj?.response?.data ?? errObj?.data ?? null,
        })
        description = 'Usuário ou senha incorretos.'
      } else if (
        errObj?.message === 'A conexão demorou muito para responder. Verifique sua internet.'
      ) {
        description = errObj.message
      } else if (
        errObj?.status === 0 ||
        errObj?.name === 'TypeError' ||
        errObj?.message?.includes('fetch')
      ) {
        description =
          'Não foi possível conectar ao servidor. Verifique sua conexão de internet e tente novamente.'
      } else {
        console.warn('[Login Error] Autenticação falhou:', {
          status: errObj?.status,
          data: errObj?.response?.data ?? errObj?.data ?? null,
        })
      }

      toast({
        title: 'Falha no Acesso',
        description,
        variant: 'destructive',
      })
    } else {
      try {
        if (values.rememberMe) {
          safeStorage.setItem('rememberedUsername', safeIdentity)
        } else {
          safeStorage.removeItem('rememberedUsername')
        }
      } catch (err) {
        console.warn('Storage fallback failed:', err)
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

      if (
        ['paulo', 'julia', 'gerente_producao'].includes(user?.role) ||
        user?.email === 'soaresclaudio@gmail.com'
      ) {
        navigate('/producao', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 items-center text-center">
          <div className="flex items-center justify-center mb-2 bg-white p-3 rounded-xl border shadow-sm">
            <img
              src={logoUrl}
              alt="CRM FERRO E AÇO Logo"
              className="h-16 w-auto object-contain"
              loading="lazy"
              decoding="async"
              width={160}
              height={64}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">CRM FERRO E AÇO</CardTitle>
          <CardDescription>Acesse o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="seu usuário"
                          className="pl-9 h-10"
                          autoComplete="username"
                          autoCapitalize="none"
                          autoCorrect="off"
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
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
                          autoComplete="current-password"
                          autoCapitalize="none"
                          autoCorrect="off"
                          value={field.value || ''}
                          onChange={(e) => {
                            field.onChange(e)
                            if (autofillDetected) setAutofillDetected(false)
                          }}
                          onKeyUp={(e) => {
                            checkCapsLock(e)
                          }}
                          onKeyUpCapture={checkCapsLock}
                          onBlur={(e) => {
                            setCapsLockOn(false)
                            field.onBlur(e)
                          }}
                          onAnimationStart={handleAutofillAnimation}
                          name={field.name}
                          ref={(el) => {
                            field.ref(el)
                            passwordInputRef.current = el
                          }}
                        />
                      </div>
                    </FormControl>
                    {capsLockOn && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Caps Lock ativado</span>
                      </div>
                    )}
                    {autofillDetected && !capsLockOn && (
                      <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        <span>Senha preenchida automaticamente — confirme se ainda é a atual</span>
                      </div>
                    )}
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
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-medium leading-none cursor-pointer">
                      Lembrar login
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-10 text-base" disabled={isLoading}>
                {isLoading ? 'Carregando...' : 'Entrar'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Esqueceu sua senha? Fale com o Adriano.
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
