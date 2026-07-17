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
  data?: Record<string, unknown>[] | null
  getData?: () => Promise<Record<string, unknown>[] | null | undefined>
  summary?: ExportSummary
  disabled?: boolean
  loading?: boolean
}

export function ExportDropdown({
  title,
  filename,
  columns,
  data,
  getData,
  summary,
  disabled,
  loading = false,
}: ExportDropdownProps) {
  const [isExporting, setIsExporting] = useState(false)

  const safeData: Record<string, unknown>[] = Array.isArray(data) ? data : []

  const resolveData = async (): Promise<Record<string, unknown>[]> => {
    if (getData) {
      try {
        const result = await getData()
        return Array.isArray(result) ? result : []
      } catch (err) {
        console.error('ExportDropdown getData failed:', err)
        return []
      }
    }
    return safeData
  }

  const isDisabled = disabled || isExporting || loading
  const dataCount = Array.isArray(data) ? data.length : 0

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
    if (isDisabled) return
    setIsExporting(true)
    try {
      const records = await resolveData()
      if (!Array.isArray(records) || records.length === 0) {
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
    if (isDisabled) return
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
