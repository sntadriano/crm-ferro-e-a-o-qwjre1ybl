import { useState } from 'react'
import { format } from 'date-fns'
import { Eye, Camera, User, Calendar, Package, Hash, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ProducaoRecord } from '@/services/producao'
import { PhotoGalleryDialog } from '@/components/producao/PhotoGalleryDialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: ProducaoRecord | null
}

export function ProducaoDetailsDialog({ open, onOpenChange, record }: Props) {
  const [galleryOpen, setGalleryOpen] = useState(false)

  if (!record) return null

  const fotos = record.expand?.fotos_producao_via_producao_id || []
  const photoCount = fotos.reduce((acc, f) => acc + (f.arquivo?.length || 0), 0)
  const itemName = record.expand?.item_id?.nome || record.item
  const unit = record.expand?.item_id?.unidade || ''
  const operatorName = record.expand?.usuario_id?.name || 'Desconhecido'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detalhes da Produção
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Package className="h-4 w-4" /> Item
                </p>
                <p className="font-medium">{itemName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Hash className="h-4 w-4" /> Quantidade
                </p>
                <p className="font-medium">
                  {record.quantidade} {unit}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> Data/Hora
                </p>
                <p className="font-medium">
                  {format(new Date(record.data_producao), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <User className="h-4 w-4" /> Operador
                </p>
                <p className="font-medium">{operatorName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={record.status === 'conferido' ? 'default' : 'secondary'}
                  className={record.status === 'conferido' ? 'bg-green-500 text-white' : ''}
                >
                  {record.status === 'conferido' ? 'Conferido' : 'Registrado'}
                </Badge>
              </div>
            </div>

            {record.observacoes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <FileText className="h-4 w-4" /> Observações
                  </p>
                  <div className="bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                    {record.observacoes}
                  </div>
                </div>
              </>
            )}

            {photoCount > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center gap-1">
                    <Camera className="h-4 w-4" /> Fotos de Evidência ({photoCount})
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setGalleryOpen(true)}>
                    <Camera className="h-4 w-4 mr-2" />
                    Visualizar {photoCount} Foto(s)
                  </Button>
                </div>
              </>
            )}

            <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-md">
              Registrado em {format(new Date(record.created), 'dd/MM/yyyy HH:mm')}
              {record.updated !== record.created && (
                <span> · Atualizado em {format(new Date(record.updated), 'dd/MM/yyyy HH:mm')}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PhotoGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        fotosRecords={fotos as any}
      />
    </>
  )
}
