import { useState, useRef, useEffect } from 'react'
import { Upload, FileText, CheckCircle2 } from 'lucide-react'
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
  const [isComplete, setIsComplete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { importCustomers } = useCustomers()

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setFile(null)
      setIsUploading(false)
      setProgress(0)
      setIsComplete(false)
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file) return

    setIsUploading(true)
    setProgress(0)

    // Simulate upload and processing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setIsComplete(true)
      setIsUploading(false)
      importCustomers(3) // Mock importing 3 customers

      toast({
        title: 'Importação concluída',
        description: '3 clientes foram importados com sucesso.',
      })

      setTimeout(() => setOpen(false), 1500)
    }, 2500)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Selecione uma planilha Excel (.xlsx) contendo os dados dos clientes.
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
                onChange={handleFileChange}
              />
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
              {file ? (
                <p className="text-sm font-medium">{file.name}</p>
              ) : (
                <div className="space-y-1">
                  <p className="text-sm font-medium">Clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">ou arraste e solte o arquivo aqui</p>
                </div>
              )}
            </div>
          )}

          {(isUploading || isComplete) && (
            <div className="space-y-4 py-4 animate-fade-in">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">
                  {isComplete ? 'Processamento concluído!' : 'Processando arquivo...'}
                </span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              {isComplete && (
                <div className="flex items-center justify-center gap-2 text-emerald-600 mt-4 animate-slide-up">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">3 registros atualizados/criados</span>
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
