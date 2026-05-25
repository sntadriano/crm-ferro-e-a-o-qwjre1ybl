import { useState } from 'react'
import { FileText, FileSpreadsheet, Loader2, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { format } from 'date-fns'

interface ExportDropdownProps {
  data?: any[]
  getData?: () => Promise<any[]>
  columns: { header: string; key: string }[]
  filename: string
  title: string
}

export function ExportDropdown({ data, getData, columns, filename, title }: ExportDropdownProps) {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null)

  const handleExport = async (formatType: 'excel' | 'pdf') => {
    setLoading(formatType)
    try {
      const exportData = getData ? await getData() : data || []

      if (exportData.length === 0) {
        toast.error('Nenhum dado para exportar')
        setLoading(null)
        return
      }

      if (formatType === 'excel') {
        const headers = columns.map((c) => c.header).join(',')
        const rows = exportData.map((d) =>
          columns
            .map((c) => {
              let val = d[c.key]
              val = val === null || val === undefined ? '' : String(val)
              val = val.replace(/"/g, '""')
              return `"${val}"`
            })
            .join(','),
        )
        const csv = [headers, ...rows].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Arquivo gerado com sucesso')
      } else if (formatType === 'pdf') {
        const printWindow = window.open('', '', 'width=800,height=600')
        if (!printWindow) {
          throw new Error('Bloqueador de pop-ups impediu a geração do PDF')
        }

        const html = `
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f5f5f5; font-weight: bold; }
                .header { margin-bottom: 20px; }
                .header h2 { margin: 0 0 10px 0; }
                .summary { color: #666; font-size: 14px; margin-top: 5px; }
                @media print {
                  @page { margin: 1cm; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h2>${title}</h2>
                <div class="summary">Total de registros: ${exportData.length}</div>
                <div class="summary">Data de exportação: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss')}</div>
              </div>
              <table>
                <thead>
                  <tr>
                    ${columns.map((c) => `<th>${c.header}</th>`).join('')}
                  </tr>
                </thead>
                <tbody>
                  ${exportData
                    .map(
                      (d) => `
                    <tr>
                      ${columns
                        .map((c) => {
                          const val =
                            d[c.key] === null || d[c.key] === undefined ? '' : String(d[c.key])
                          return `<td>${val}</td>`
                        })
                        .join('')}
                    </tr>
                  `,
                    )
                    .join('')}
                </tbody>
              </table>
              <script>
                window.onload = () => {
                  setTimeout(() => {
                    window.print();
                    window.close();
                  }, 250);
                }
              </script>
            </body>
          </html>
        `
        printWindow.document.write(html)
        printWindow.document.close()
        toast.success('Visualização para PDF gerada')
      }
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar arquivo', {
        action: {
          label: 'Tentar novamente',
          onClick: () => handleExport(formatType),
        },
      })
    } finally {
      setLoading(null)
    }
  }

  if (isMobile) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="min-h-[44px] min-w-[44px]">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport('excel')} disabled={!!loading}>
            <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
            <span>Exportar Excel</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={!!loading}>
            <FileText className="mr-2 h-4 w-4 text-red-600" />
            <span>Exportar PDF</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="min-h-[44px] shadow-sm bg-white"
        onClick={() => handleExport('excel')}
        disabled={!!loading}
      >
        {loading === 'excel' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-green-600" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
        )}
        Exportar Excel
      </Button>
      <Button
        variant="outline"
        className="min-h-[44px] shadow-sm bg-white"
        onClick={() => handleExport('pdf')}
        disabled={!!loading}
      >
        {loading === 'pdf' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-red-600" />
        ) : (
          <FileText className="mr-2 h-4 w-4 text-red-600" />
        )}
        Exportar PDF
      </Button>
    </div>
  )
}
