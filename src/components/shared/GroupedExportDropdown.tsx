import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  exportGroupedToExcel,
  exportGroupedToPDF,
  type ExportColumn,
  type ExportGroup,
} from '@/lib/export-grouped'
import { toast } from 'sonner'

interface GroupedExportDropdownProps {
  company: string
  period: string
  title: string
  filename?: string
  columns: ExportColumn[]
  groups: ExportGroup[]
  grandTotal: { label: string; value: string }[]
  disabled?: boolean
  loading?: boolean
}

export function GroupedExportDropdown({
  company,
  period,
  title,
  filename = 'relatorio_agrupado',
  columns,
  groups,
  grandTotal,
  disabled,
  loading = false,
}: GroupedExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)
  const isDisabled = disabled || isExporting || loading || groups.length === 0

  const handleExcel = async () => {
    if (isDisabled) return
    setIsExporting(true)
    try {
      if (groups.length === 0) {
        toast.warning('Não há dados para exportar.')
        return
      }
      exportGroupedToExcel(company, period, groups, grandTotal, filename)
      toast.success('Exportação Excel concluída.')
    } catch (err) {
      console.error('Export Excel failed:', err)
      toast.error('Falha ao exportar Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDF = async () => {
    if (isDisabled) return
    setIsExporting(true)
    try {
      if (groups.length === 0) {
        toast.warning('Não há dados para exportar.')
        return
      }
      exportGroupedToPDF(company, period, groups, grandTotal, title)
      toast.success('Exportação PDF concluída.')
    } catch (err) {
      console.error('Export PDF failed:', err)
      toast.error('Falha ao exportar PDF.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          aria-busy={isExporting || loading}
        >
          {isExporting || loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} disabled={isDisabled}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF} disabled={isDisabled}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
