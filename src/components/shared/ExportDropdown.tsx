import { Download, FileSpreadsheet, FileText } from 'lucide-react'
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

interface ExportDropdownProps {
  title: string
  columns: ExportColumn[]
  data: Record<string, unknown>[]
  summary?: ExportSummary
  disabled?: boolean
}

export function ExportDropdown({ title, columns, data, summary, disabled }: ExportDropdownProps) {
  const hasData = data.length > 0

  const handleExcel = () => {
    if (!hasData) return
    exportToExcel(title, columns, data)
  }

  const handlePDF = () => {
    if (!hasData) return
    exportToPDF(title, columns, data, summary)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || !hasData}>
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel} disabled={!hasData}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Exportar Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF} disabled={!hasData}>
          <FileText className="h-4 w-4 mr-2" />
          Exportar PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
