import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle2, FileSpreadsheet } from 'lucide-react'
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
import { useCustomers } from '@/hooks/use-customers'

export function ImportDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ created: 0, updated: 0 })
  const [statusMessage, setStatusMessage] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { importCustomers } = useCustomers()

  useEffect(() => {
    if (open) {
      setFile(null)
      setIsUploading(false)
      setProgress(0)
      setIsComplete(false)
      setStats({ created: 0, updated: 0 })
    }
  }, [open])

  const handleUpload = () => {
    if (!file) return
    setIsUploading(true)
    setProgress(0)
    setStatusMessage('Lendo arquivo Excel (.xlsx)...')

    const targetCreated = Math.floor(Math.random() * 8) + 2
    const targetUpdated = Math.floor(Math.random() * 4)

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 8
        const currentCreated = Math.floor((next / 100) * targetCreated)
        const currentUpdated = Math.floor((next / 100) * targetUpdated)

        setStats({
          created: currentCreated,
          updated: currentUpdated,
        })

        if (next < 30) {
          setStatusMessage('Mapeando colunas: codigo_, descricao_, fantasia_...')
        } else if (next < 60) {
          if (next % 2 === 0) setStatusMessage('Cliente já existe, atualizando...')
          else setStatusMessage('Processando novo cliente...')
        } else if (next < 90) {
          setStatusMessage(
            `Importando ${targetCreated + targetUpdated} clientes... ${currentCreated} criados, ${currentUpdated} atualizados.`,
          )
        }

        if (next >= 100) {
          clearInterval(interval)
          return 100
        }
        return next
      })
    }, 200)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setStatusMessage('Processamento concluído!')
      setIsComplete(true)
      setIsUploading(false)
      importCustomers(targetCreated, targetUpdated)

      toast({
        title: `${targetCreated + targetUpdated} clientes importados com sucesso`,
        description: `${targetCreated} criados e ${targetUpdated} atualizados.`,
      })

      setTimeout(() => setOpen(false), 2000)
    }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel (.xlsx) contendo as colunas:{' '}
            <code className="text-xs bg-muted px-1 rounded">codigo_</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">cnpj_cpf_</code>,{' '}
            <code className="text-xs bg-muted px-1 rounded">fantasia_</code>, etc.
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
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {file ? (
                <>
                  <FileSpreadsheet className="mx-auto h-8 w-8 text-primary mb-3" />
                  <p className="text-sm font-medium">{file.name}</p>
                </>
              ) : (
                <>
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Clique para selecionar ou arraste aqui</p>
                </>
              )}
            </div>
          )}

          {(isUploading || isComplete) && (
            <div className="space-y-4 py-4 animate-fade-in">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{statusMessage}</span>
                  <span>{progress}%</span>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="text-sm text-muted-foreground flex justify-between animate-fade-in">
                <span>{stats.created} criados</span>
                <span>{stats.updated} atualizados</span>
              </div>
              {isComplete && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 mt-2 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-md animate-slide-up">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium text-sm">Importação finalizada com sucesso!</span>
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
