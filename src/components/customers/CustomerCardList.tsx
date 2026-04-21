import { Link } from 'react-router-dom'
import { Building2, User as UserIcon, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Customer } from '@/types/customer'
import { StatusBadge } from './StatusBadge'

interface CustomerCardListProps {
  customers: Customer[]
}

export function CustomerCardList({ customers }: CustomerCardListProps) {
  if (customers.length === 0) {
    return (
      <div className="p-8 text-center bg-card rounded-lg border shadow-sm">
        <p className="text-muted-foreground">Nenhum cliente encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {customers.map((customer) => (
        <Card key={customer.id} className="p-4 hover:border-primary/50 transition-colors">
          <Link to={`/clientes/${customer.id}`} className="flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-md mt-1">
                  {customer.type === 'PJ' ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base line-clamp-1">
                    {customer.tradeName || customer.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{customer.document}</p>
                </div>
              </div>
              <StatusBadge status={customer.status} className="shrink-0" />
            </div>

            <div className="flex items-center justify-between text-sm mt-1 border-t pt-3">
              <span className="text-muted-foreground">{customer.code}</span>
              <span className="text-primary font-medium flex items-center gap-1">
                Detalhes <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
