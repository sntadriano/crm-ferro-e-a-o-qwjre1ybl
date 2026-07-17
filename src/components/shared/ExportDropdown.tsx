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
  exportToExcel,
  exportToPDF,
  type ExportColumn,
  type ExportSummary,
} from '@/lib/export-utils'
import { toast } from 'sonner'

interface ExportDropdownProps {
  title: string
  filename?: string
  columns: ExportColumn[]
  data?: Record<string, unknown>[]
  getData?: () => Promise<Record<string, unknown>[]>
  summary?: ExportSummary
  disabled?: boolean
}

export function ExportDropdown({
  title,
  filename,
  columns,
  data,
  getData,
  summary,
  disabled,
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const resolveData = async (): Promise<Record<string, unknown>[]> => {
    if (getData) {
      const result = await getData()
      return Array.isArray(result) ? result : []
    }
    return Array.isArray(data) ? data : []
  }

  const buildSummary = (records: Record<string, unknown>[]): ExportSummary => {
    const now = new Date()
    return (
      summary ?? {
        total: records.length,
        date: now.toLocaleDateString(),
        datetime: now.toLocaleString(),
      }
    )
  }

  const handleExcel = async () => {
    if (disabled || isExporting) return
    setIsExporting(true)
    try {
      const records = await resolveData()
      if (records.length === 0) {
        toast.warning('Não há dados para exportar.')
        return
      }
      exportToExcel(title, columns, records)
      toast.success('Exportação Excel concluída.')
    } catch (err) {
      console.error('Export Excel failed:', err)
      toast.error('Falha ao exportar Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  const handlePDF = async () => {
    if (disabled || isExporting) return
    setIsExporting(true)
    try {
      const records = await resolveData()
      if (records.length === 0) {
        toast.warning('Não há dados para exportar.')
        return
      }
      exportToPDF(title, columns, records, buildSummary(records))
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
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} disabled={isExporting}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF} disabled={isExporting}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
