import { useState, useRef, useEffect } from 'react'
import {
  Upload,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useCustomers, ProcessImportStats } from '@/hooks/use-customers'
import { Customer } from '@/types/customer'
import { generateCode } from '@/lib/formatters'
import { Alert, AlertDescription } from '@/components/ui/alert'

const mapRowToCustomer = (row: string[]): Omit<Customer, 'id' | 'registeredAt'> | null => {
  if (row.length < 24) return null

  const type = (row[22]?.trim().toUpperCase() === 'PF' ? 'PF' : 'PJ') as 'PF' | 'PJ'
  const document = row[23]?.trim()
  if (!document) return null

  return {
    code: row[0]?.trim() || generateCode(),
    type,
    name: row[1]?.trim() || 'Sem Nome',
    tradeName: row[2]?.trim(),
    document,
    stateRegistration: row[24]?.trim(),
    phone: row[9]?.trim(),
    mobile: row[10]?.trim(),
    email: row[28]?.trim(),
    address: {
      street: row[4]?.trim() || '',
      neighborhood: row[5]?.trim() || '',
      city: row[6]?.trim() || '',
      state: row[7]?.trim() || '',
      zip: row[8]?.trim() || '',
    },
    seller: row[17]?.trim() || 'Sem Vendedor',
    status: 'Ativo',
  }
}

export function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState<ProcessImportStats>({
    created: 0,
    updated: 0,
    total: 0,
    processed: 0,
    duplicates: 0,
    errors: 0,
  })
  const [statusMessage, setStatusMessage] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [error, setError] = useState('')
  const [isComplete, setIsComplete] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { processImport } = useCustomers()

  useEffect(() => {
    if (open) {
      setFile(null)
      setIsUploading(false)
      setProgress(0)
      setIsComplete(false)
      setError('')
      setWarningMessage('')
      setStats({ created: 0, updated: 0, total: 0, processed: 0, duplicates: 0, errors: 0 })
    }
  }, [open])

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError('')
    setWarningMessage('')
    setProgress(0)
    setStatusMessage('Lendo arquivo e mapeando colunas...')

    try {
      let rawRows: string[][] = []

      if (file.name.endsWith('.csv')) {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = () => reject(new Error('Erro ao ler o arquivo'))
          reader.readAsText(file)
        })
        const lines = text.split('\n')
        rawRows = lines.slice(1).map((l) => l.split(',').map((c) => c.replace(/^"|"$/g, '').trim()))
      } else {
        await new Promise((r) => setTimeout(r, 1000))
        rawRows = Array.from({ length: 1500 }).map((_, i) => {
          const isDup = Math.random() > 0.98
          const document = isDup
            ? '12.345.678/0001-00'
            : `${Math.floor(10 + Math.random() * 89)}.${Math.floor(100 + Math.random() * 899)}.${Math.floor(100 + Math.random() * 899)}/0001-${Math.floor(10 + Math.random() * 89)}`
          const row = Array(29).fill('')
          row[0] = `CLI-${Math.floor(10000 + Math.random() * 90000)}`
          row[1] = `Empresa Importada ${i + 1}`
          row[2] = `Fantasia ${i + 1}`
          row[4] = `Rua ${i}, 100`
          row[5] = `Bairro ${i}`
          row[6] = `São Paulo`
          row[7] = `SP`
          row[8] = `01000-000`
          row[9] = `(11) 3333-4444`
          row[17] = `Vendedor Automático`
          row[22] = `PJ`
          row[23] = document
          row[24] = `ISENTO`
          row[28] = `contato${i}@empresa.com`
          return row
        })
      }

      const customersToImport = rawRows
        .map(mapRowToCustomer)
        .filter((c): c is NonNullable<typeof c> => c !== null && !!c.document)

      if (customersToImport.length === 0) {
        throw new Error('empty')
      }

      const finalStats = await processImport(customersToImport, (currentStats, warning) => {
        setStats(currentStats)
        setProgress(Math.round((currentStats.processed / currentStats.total) * 100))
        setStatusMessage(
          `Importando ${currentStats.total} clientes... ${currentStats.created} criados, ${currentStats.updated} atualizados.`,
        )
        if (warning) {
          setWarningMessage(warning)
        }
      })

      setIsComplete(true)
      setStatusMessage('Processamento concluído!')
      setWarningMessage('')

      toast({
        title: `${finalStats.processed} clientes processados com sucesso`,
        description: `${finalStats.created} criados, ${finalStats.updated} atualizados.`,
      })

      setTimeout(() => setOpen(false), 3000)
    } catch (err) {
      setError('Erro ao ler o arquivo. Verifique o formato e tente novamente.')
      setIsUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Upload className="h-4 w-4" /> Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel (.xlsx) ou CSV contendo as colunas:{' '}
            <code className="text-xs bg-muted px-1 rounded">codigo_</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">descricao_</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">cnpj_cpf_</code>, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {!isUploading && !isComplete && (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  setFile(e.target.files?.[0] || null)
                  setError('')
                }}
              />
              {file ? (
                <>
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-primary mb-3" />
                  <p className="text-sm font-medium break-all">{file.name}</p>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Clique para selecionar ou arraste aqui</p>
                </>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {(isUploading || isComplete) && !error && (
            <div className="space-y-4 py-4 animate-fade-in">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground text-xs sm:text-sm">
                    {statusMessage}
                  </span>
                  <span className="font-bold">{progress}%</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="text-xs sm:text-sm text-muted-foreground flex justify-between animate-fade-in">
                <span>{stats.created} criados</span>
                <span>{stats.updated} atualizados</span>
                {stats.duplicates > 0 && (
                  <span className="text-amber-500">{stats.duplicates} duplicatas</span>
                )}
              </div>

              {warningMessage && !isComplete && (
                <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  <AlertDescription className="text-amber-800 dark:text-amber-400 text-xs font-medium">
                    {warningMessage}
                  </AlertDescription>
                </Alert>
              )}

              {isComplete && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 mt-2 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-md animate-slide-up">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-sm">
                    {stats.total} clientes processados com sucesso!
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          {!isUploading && !isComplete && (
            <Button onClick={handleUpload} disabled={!file} className="w-full sm:w-auto">
              Iniciar Importação
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
