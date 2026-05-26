import pb from '@/lib/pocketbase/client'

export interface FotosProducaoRecord {
  id: string
  producao_id: string
  arquivo: string[]
  collectionId: string
  collectionName: string
  created: string
  updated: string
}

export const uploadFotosProducao = async (producaoId: string, files: File[]) => {
  if (files.length === 0) return null

  const formData = new FormData()
  formData.append('producao_id', producaoId)
  files.forEach((file) => {
    formData.append('arquivo', file)
  })

  return pb.collection('fotos_producao').create<FotosProducaoRecord>(formData)
}

export const getFileUrl = (
  record: Pick<FotosProducaoRecord, 'id' | 'collectionId' | 'collectionName'>,
  filename: string,
) => {
  return pb.files.getURL(record as any, filename)
}
