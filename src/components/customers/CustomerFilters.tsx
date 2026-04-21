import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

interface CustomerFiltersProps {
  search: string
  setSearch: (v: string) => void
  status: string
  setStatus: (v: string) => void
  seller: string
  setSeller: (v: string) => void
  onClear: () => void
}

export function CustomerFilters({
  search,
  setSearch,
  status,
  setStatus,
  seller,
  setSeller,
  onClear,
}: CustomerFiltersProps) {
  return (
    <div className="bg-card p-4 rounded-lg border shadow-sm grid gap-4 md:grid-cols-12 items-end">
      <div className="md:col-span-4 space-y-1.5">
        <Label htmlFor="search" className="text-xs text-muted-foreground">
          Busca
        </Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Nome, Fantasia, CNPJ ou CPF"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="md:col-span-3 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Ativo">Ativo</SelectItem>
            <SelectItem value="Inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-3 space-y-1.5">
        <Label className="text-xs text-muted-foreground">Vendedor Responsável</Label>
        <Select value={seller} onValueChange={setSeller}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os vendedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os vendedores</SelectItem>
            <SelectItem value="Vendedor A">Vendedor A</SelectItem>
            <SelectItem value="Vendedor B">Vendedor B</SelectItem>
            <SelectItem value="Vendedor C">Vendedor C</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Button variant="ghost" className="w-full" onClick={onClear}>
          Limpar Filtros
        </Button>
      </div>
    </div>
  )
}
