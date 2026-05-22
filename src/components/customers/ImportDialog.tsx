import { useState } from 'react'
import { Upload, FileSpreadsheet, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { ScrollArea } from '@/components/ui/scroll-area'

export function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as any[],
  })
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setImportDone(false)
      setStats({ total: 0, created: 0, updated: 0, skipped: 0, errors: [] })
    }
  }

  const parseCSV = (text: string): string[][] => {
    const firstLine = text.split('\n')[0] || ''
    const delimiter =
      (firstLine.match(/;/g)?.length || 0) > (firstLine.match(/,/g)?.length || 0) ? ';' : ','

    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
    return lines.map((line) => {
      const result: string[] = []
      let current = ''
      let inQuotes = false
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"') {
          inQuotes = !inQuotes
        } else if (char === delimiter && !inQuotes) {
          result.push(current)
          current = ''
        } else {
          current += char
        }
      }
      result.push(current)
      return result.map((v) => v.trim().replace(/^"|"$/g, ''))
    })
  }

  const handleImport = async () => {
    if (!file) return
    setIsImporting(true)

    try {
      const text = await file.text()
      const rows = parseCSV(text)

      const result = await pb.send('/backend/v1/clientes/import', {
        method: 'POST',
        body: JSON.stringify({ rows, fileName: file.name }),
        headers: { 'Content-Type': 'application/json' },
      })

      setStats({
        total: result.total || 0,
        created: result.created || 0,
        updated: result.updated || 0,
        skipped: result.skipped || 0,
        errors: result.errors || [],
      })

      toast({
        title: 'Importação finalizada',
        description: `${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados/erros de ${result.total} lidos.`,
        className:
          result.errors?.length > 0
            ? 'bg-amber-600 text-white border-none'
            : 'bg-emerald-600 text-white border-none',
      })

      setImportDone(true)
    } catch (error: any) {
      toast({
        title: 'Erro na importação',
        description: error?.message || 'Erro ao processar o arquivo.',
        variant: 'destructive',
      })
    } finally {
      setIsImporting(false)
    }
  }

  const resetAndClose = () => {
    setOpen(false)
    setTimeout(() => {
      setFile(null)
      setImportDone(false)
      setStats({ total: 0, created: 0, updated: 0, skipped: 0, errors: [] })
    }, 300)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetAndClose()}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" onClick={() => setOpen(true)}>
          <FileSpreadsheet className="h-4 w-4" /> Importar Planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha (.csv) para cadastrar ou atualizar clientes. O CNPJ/CPF será
            usado como identificador único para atualizar registros existentes.
          </DialogDescription>
        </DialogHeader>

        {!isImporting && !importDone && (
          <div className="space-y-4 py-4">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
              <div className="text-sm font-medium text-foreground mb-1">
                Clique para selecionar ou arraste o arquivo
              </div>
              <div className="text-xs text-muted-foreground">
                Suporta arquivos .csv (separados por ponto e vírgula ou vírgula)
              </div>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                id="excel-upload"
                onChange={handleFileChange}
              />
              <Button asChild variant="secondary" className="mt-4">
                <label htmlFor="excel-upload" className="cursor-pointer">
                  Selecionar Arquivo
                </label>
              </Button>
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium truncate">{file.name}</span>
                <span className="text-muted-foreground ml-auto flex-shrink-0">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}

            <Button className="w-full" onClick={handleImport} disabled={!file}>
              Iniciar Importação
            </Button>
          </div>
        )}

        {isImporting && (
          <div className="space-y-6 py-12 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="text-sm font-medium text-center">
              Processando e validando planilha...
              <br />
              <span className="text-muted-foreground text-xs">
                Isso pode levar alguns instantes.
              </span>
            </div>
          </div>
        )}

        {importDone && (
          <div className="space-y-6 py-4 flex-1 overflow-hidden flex flex-col">
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div className="bg-muted p-3 rounded-md">
                <div className="font-bold text-lg">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Lidos</div>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-md">
                <div className="font-bold text-lg">{stats.created}</div>
                <div className="text-xs opacity-80">Criados</div>
              </div>
              <div className="bg-blue-50 text-blue-700 p-3 rounded-md">
                <div className="font-bold text-lg">{stats.updated}</div>
                <div className="text-xs opacity-80">Atualizados</div>
              </div>
              <div className="bg-amber-50 text-amber-700 p-3 rounded-md">
                <div className="font-bold text-lg">{stats.skipped}</div>
                <div className="text-xs opacity-80">Erros</div>
              </div>
            </div>

            {stats.errors.length > 0 ? (
              <div className="flex-1 overflow-hidden flex flex-col bg-muted/30 rounded-md border">
                <div className="p-3 border-b bg-muted/50 flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  Problemas encontrados ({stats.errors.length})
                </div>
                <ScrollArea className="flex-1 p-0">
                  <ul className="divide-y text-sm">
                    {stats.errors.map((err, idx) => (
                      <li key={idx} className="p-3 flex gap-3 hover:bg-muted/50">
                        <span className="font-medium min-w-[65px] text-muted-foreground">
                          Linha {err.row}
                        </span>
                        <span className="text-foreground">{err.reason}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-md text-emerald-700">
                <CheckCircle2 className="h-10 w-10 mb-2" />
                <span className="font-medium text-center">Importação concluída sem erros!</span>
              </div>
            )}

            <Button className="w-full" onClick={resetAndClose}>
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
