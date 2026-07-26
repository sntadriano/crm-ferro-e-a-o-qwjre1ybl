import pb from '@/lib/pocketbase/client'
import { RecordModel } from 'pocketbase'

export interface VendedorRecord extends RecordModel {
  codigo: number
  nome: string
}

export const getVendedores = async (): Promise<VendedorRecord[]> => {
  return pb.collection('vendedores').getFullList<VendedorRecord>({ sort: 'codigo' })
}

export const getVendedorName = async (
  codigo: number | string | undefined | null,
): Promise<string> => {
  if (codigo === undefined || codigo === null || codigo === '') return '-'
  const num = Number(codigo)
  if (!Number.isFinite(num)) return String(codigo)
  try {
    const rec = await pb
      .collection('vendedores')
      .getFirstListItem<VendedorRecord>(`codigo = ${num}`)
    return rec?.nome || String(codigo)
  } catch {
    return String(codigo)
  }
}
