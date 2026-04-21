export type CustomerType = 'PF' | 'PJ'
export type CustomerStatus = 'Ativo' | 'Inativo'

export interface CustomerAddress {
  street: string
  neighborhood: string
  city: string
  state: string
  zip: string
}

export interface Customer {
  id: string
  code: string
  type: CustomerType
  name: string
  tradeName?: string
  document: string
  stateRegistration?: string
  phone?: string
  mobile?: string
  email?: string
  address: CustomerAddress
  seller: string
  registeredAt: string
  status: CustomerStatus
  lastOrderAt?: string
}
