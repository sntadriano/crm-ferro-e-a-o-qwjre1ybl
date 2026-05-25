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
import pb from '@/lib/pocketbase/client'
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

      const summary = {
        total: exportData.length,
        date: format(new Date(), 'dd/MM/yyyy'),
        datetime: format(new Date(), 'dd/MM/yyyy HH:mm:ss'),
      }

      const endpoint =
        formatType === 'excel' ? '/backend/v1/export/excel' : '/backend/v1/export/pdf'
      const extension = formatType === 'excel' ? 'xlsx' : 'pdf'

      const urlStr = pb.buildUrl(endpoint)
      const token = pb.authStore.token

      const res = await fetch(urlStr, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, columns, data: exportData, summary }),
      })

      if (!res.ok) {
        throw new Error('Falha na exportação')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast.success('Arquivo gerado com sucesso')
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
