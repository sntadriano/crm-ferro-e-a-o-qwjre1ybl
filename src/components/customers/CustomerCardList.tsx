import { Link } from 'react-router-dom'
import { Building2, User as UserIcon, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Customer } from '@/types/customer'
import { StatusBadge } from './StatusBadge'
import { formatClientDisplayName } from '@/lib/entity-labels'

interface CustomerCardListProps {
  customers: Customer[]
}

export function CustomerCardList({ customers }: CustomerCardListProps) {
  if (customers.length === 0) return null

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
      {customers.map((customer) => (
        <Card
          key={customer.id}
          className="p-4 hover:border-accent transition-colors shadow-subtle border-muted"
        >
          <Link to={`/clientes/${customer.id}`} className="flex flex-col gap-3 h-full min-h-[44px]">
            <div className="flex justify-between items-start">
              <div className="flex gap-3 items-start">
                <div className="bg-primary/10 p-2 rounded-md mt-1 shrink-0">
                  {customer.type === 'PJ' ? (
                    <Building2 className="h-4 w-4 text-primary" />
                  ) : (
                    <UserIcon className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-base line-clamp-1">
                    {formatClientDisplayName(customer, customers)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 font-medium">
                    {customer.document}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm mt-auto border-t pt-3">
              <StatusBadge status={customer.status} className="shrink-0" />
              <span className="text-accent font-semibold flex items-center gap-1">
                Detalhes <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
