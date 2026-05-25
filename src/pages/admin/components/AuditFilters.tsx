import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Search } from 'lucide-react'

interface Props {
  filters: { tabela: string; usuario: string; startDate: string; endDate: string }
  setFilters: React.Dispatch<React.SetStateAction<any>>
}

export function AuditFilters({ filters, setFilters }: Props) {
  const handleChange = (key: string, value: string) => {
    setFilters((prev: any) => ({ ...prev, [key]: value }))
  }

  const FilterContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="space-y-2">
        <Label>Tabela</Label>
        <Select value={filters.tabela} onValueChange={(v) => handleChange('tabela', v)}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="clientes">Clientes</SelectItem>
            <SelectItem value="leads">Leads</SelectItem>
            <SelectItem value="contatos">Contatos</SelectItem>
            <SelectItem value="producao">Produção</SelectItem>
            <SelectItem value="users">Usuários</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Usuário</Label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nome..."
            value={filters.usuario}
            onChange={(e) => handleChange('usuario', e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Data Início</Label>
        <Input
          type="date"
          value={filters.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Data Fim</Label>
        <Input
          type="date"
          value={filters.endDate}
          onChange={(e) => handleChange('endDate', e.target.value)}
        />
      </div>
    </div>
  )

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="hidden md:block">
        <FilterContent />
      </div>
      <div className="md:hidden">
        <Accordion type="single" collapsible>
          <AccordionItem value="filters" className="border-none">
            <AccordionTrigger className="py-0">Filtros Avançados</AccordionTrigger>
            <AccordionContent className="pt-4">
              <FilterContent />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}
