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
  FormDescription,
} from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

import { createProducao, updateProducao, ProducaoRecord } from '@/services/producao'
import { getActiveItensProducao, ItemProducao } from '@/services/itens_producao'
import { uploadFotosProducao } from '@/services/fotos_producao'
import { useAuth } from '@/hooks/use-auth'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { cn } from '@/lib/utils'
import { X, ImagePlus, Check, ChevronsUpDown } from 'lucide-react'

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

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
    if (!open) {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
      setPreviewUrls([])
      setSelectedFiles([])
    }
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

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('image/')) return resolve(file)
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img
          const maxWidth = 1920

          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) return resolve(file)
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) return resolve(file)
              resolve(
                new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                }),
              )
            },
            'image/jpeg',
            0.8,
          )
        }
        img.onerror = () => resolve(file)
      }
      reader.onerror = () => resolve(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return

    const files = Array.from(e.target.files)
    const validTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']

    const newValidFiles: File[] = []

    for (const file of files) {
      if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.heic')) {
        toast.error(`Formato inválido: ${file.name}. Apenas JPG, PNG e HEIC são permitidos.`)
        continue
      }

      const compressed = await compressImage(file)
      newValidFiles.push(compressed)
    }

    if (selectedFiles.length + newValidFiles.length > 5) {
      toast.error('Máximo de 5 fotos permitido.')
      return
    }

    const updatedFiles = [...selectedFiles, ...newValidFiles].slice(0, 5)
    setSelectedFiles(updatedFiles)

    const newPreviewUrls = updatedFiles.map((file) => URL.createObjectURL(file))
    setPreviewUrls(newPreviewUrls)
  }

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles]
    newFiles.splice(index, 1)
    setSelectedFiles(newFiles)

    const newUrls = [...previewUrls]
    URL.revokeObjectURL(newUrls[index])
    newUrls.splice(index, 1)
    setPreviewUrls(newUrls)
  }

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
        const newRecord = await createProducao(data)

        if (selectedFiles.length > 0) {
          try {
            await uploadFotosProducao(newRecord.id, selectedFiles)
          } catch (uploadError) {
            toast.error('Produção registrada, mas houve um erro ao enviar as fotos.')
            console.error(uploadError)
          }
        }

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
                <FormItem className="flex flex-col">
                  <FormLabel>Item Produzido</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          role="combobox"
                          className={cn(
                            'w-full justify-between font-normal',
                            !field.value && 'text-muted-foreground',
                          )}
                        >
                          {field.value
                            ? items.find((i) => i.id === field.value)?.nome || 'Item selecionado'
                            : 'Selecione ou busque um item...'}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar item..." />
                        <CommandList>
                          <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                          <CommandGroup>
                            {items.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.nome}
                                onSelect={() => {
                                  form.setValue('item_id', item.id, { shouldValidate: true })
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    item.id === field.value ? 'opacity-100' : 'opacity-0',
                                  )}
                                />
                                {item.nome} ({item.unidade})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

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
              render={({ field }) => {
                const [datePart, timePart] = (field.value || '').split('T')
                const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const newDate = e.target.value
                  const currentTime = timePart || '00:00'
                  field.onChange(newDate ? `${newDate}T${currentTime}` : '')
                }
                const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  const newTime = e.target.value
                  const currentDate = datePart || format(new Date(), 'yyyy-MM-dd')
                  field.onChange(`${currentDate}T${newTime}`)
                }
                return (
                  <FormItem>
                    <FormLabel>Data/Hora</FormLabel>
                    <div className="grid grid-cols-2 gap-4">
                      <FormControl>
                        <Input type="date" value={datePart || ''} onChange={handleDateChange} />
                      </FormControl>
                      <FormControl>
                        <Input type="time" value={timePart || ''} onChange={handleTimeChange} />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />

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

            {!record && (
              <div className="space-y-3">
                <FormLabel>Fotos de Evidência (Máx. 5)</FormLabel>

                {selectedFiles.length < 5 && (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted border-border">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImagePlus className="w-6 h-6 mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Clique para enviar</span> ou arraste e
                          solte
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, HEIC (Máx. 5MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        accept=".jpg,.jpeg,.png,.heic"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                )}

                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {previewUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-md overflow-hidden border border-border group"
                      >
                        <img
                          src={url}
                          alt={`Preview ${i + 1}`}
                          className="object-cover w-full h-full"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
