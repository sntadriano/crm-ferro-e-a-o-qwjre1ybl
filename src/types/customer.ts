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
  tradeName: string
  document: string
  stateRegistration: string
  store?: string
  phone?: string
  mobile?: string
  email?: string
  address: CustomerAddress
  billingAddress?: CustomerAddress
  billingPhone?: string
  seller: string
  region?: string
  activity?: string
  economicCategory?: string
  contact?: string
  motherName?: string
  birthDate?: string
  registeredAt: string
  status: CustomerStatus
  lastOrderAt?: string
}
