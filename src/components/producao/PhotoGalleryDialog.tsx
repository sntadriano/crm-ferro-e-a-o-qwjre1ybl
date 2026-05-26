import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getFileUrl } from '@/services/fotos_producao'
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Photo {
  record: any
  filename: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  fotosRecords?: Array<{
    id: string
    arquivo: string[]
    collectionId: string
    collectionName: string
  }>
}

export function PhotoGalleryDialog({ open, onOpenChange, fotosRecords }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [zoom, setZoom] = useState(1)

  const photos: Photo[] = []
  fotosRecords?.forEach((record) => {
    record.arquivo.forEach((filename) => {
      photos.push({ record, filename })
    })
  })

  if (!open || photos.length === 0) return null

  const handleNext = () => {
    setZoom(1)
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  const handlePrev = () => {
    setZoom(1)
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const currentPhoto = photos[currentIndex]
  const photoUrl = getFileUrl(currentPhoto.record, currentPhoto.filename)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col bg-black border-none text-white [&>button]:hidden">
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent flex flex-row items-center justify-between">
          <DialogTitle className="text-white">
            Galeria de Fotos ({currentIndex + 1} de {photos.length})
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-white rounded-full hover:bg-white/20"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <div
            className="transition-transform duration-200 ease-out flex items-center justify-center h-full w-full"
            style={{ transform: `scale(${zoom})` }}
          >
            <img
              src={photoUrl}
              alt={`Foto ${currentIndex + 1}`}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full h-12 w-12"
                onClick={handleNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 p-2 rounded-full backdrop-blur-sm">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-white hover:bg-white/20"
              onClick={() => setZoom(Math.min(3, zoom + 0.5))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {photos.length > 1 && (
          <div className="h-24 bg-black/90 p-2 flex items-center justify-center gap-2 overflow-x-auto">
            {photos.map((p, idx) => (
              <button
                key={p.filename}
                onClick={() => {
                  setZoom(1)
                  setCurrentIndex(idx)
                }}
                className={`relative h-16 w-16 shrink-0 rounded-md overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-50 hover:opacity-100'}`}
              >
                <img
                  src={getFileUrl(p.record, p.filename)}
                  className="h-full w-full object-cover"
                  alt=""
                />
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
