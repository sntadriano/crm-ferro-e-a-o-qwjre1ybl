import { useState } from 'react'
import { Plus, Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { RecordModel } from 'pocketbase'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { QuickCreateClienteDialog } from './QuickCreateClienteDialog'

interface ClienteComboboxProps {
  clientes: RecordModel[]
  value: string
  onChange: (value: string) => void
  loading?: boolean
  onClienteCreated?: (cliente: RecordModel) => void
}

export function ClienteCombobox({
  clientes,
  value,
  onChange,
  loading,
  onClienteCreated,
}: ClienteComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const selected = clientes.find((c) => c.id === value)

  const filtered = clientes.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    const fantasia = (c.fantasia || '').toLowerCase()
    const descricao = (c.descricao || '').toLowerCase()
    return fantasia.includes(q) || descricao.includes(q)
  })

  const handleCreated = (cliente: RecordModel) => {
    onClienteCreated?.(cliente)
    onChange(cliente.id)
    setQuickCreateOpen(false)
    setOpen(false)
  }

  const label = (c: RecordModel) => c.fantasia || c.descricao
  const sub = (c: RecordModel) => (c.fantasia ? c.descricao : '') || c.cnpj_cpf || ''

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className={cn('w-full justify-between font-normal', !value && 'text-muted-foreground')}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando...
              </span>
            ) : value && selected ? (
              <span className="truncate">{label(selected)}</span>
            ) : (
              'Selecione ou busque um cliente'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome fantasia ou razão social..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-[280px] overflow-y-auto">
              {filtered.length === 0 ? (
                <>
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setQuickCreateOpen(true)
                      }}
                      className="text-primary font-medium"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Cadastrar novo cliente
                    </CommandItem>
                  </CommandGroup>
                </>
              ) : (
                <CommandGroup>
                  {filtered.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.id}
                      onSelect={() => {
                        onChange(c.id === value ? '' : c.id)
                        setOpen(false)
                        setSearch('')
                      }}
                      className="flex items-start gap-2 py-2"
                    >
                      <Check
                        className={cn(
                          'mt-0.5 h-4 w-4 shrink-0',
                          c.id === value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{label(c)}</span>
                        {sub(c) && <span className="text-xs text-muted-foreground">{sub(c)}</span>}
                      </div>
                    </CommandItem>
                  ))}
                  <CommandSeparator />
                  <CommandItem
                    onSelect={() => {
                      setQuickCreateOpen(true)
                    }}
                    className="text-primary font-medium"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar novo cliente
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <QuickCreateClienteDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        initialName={search}
        onCreated={handleCreated}
      />
    </>
  )
}
