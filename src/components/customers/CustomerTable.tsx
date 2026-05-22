import { Link } from 'react-router-dom'
import { Eye, Mail, Phone } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Customer } from '@/types/customer'
import { StatusBadge } from './StatusBadge'

interface CustomerTableProps {
  customers: Customer[]
  isLoading?: boolean
}

export function CustomerTable({ customers, isLoading }: CustomerTableProps) {
  if (isLoading) {
    return (
      <div className="border rounded-md animate-pulse bg-card">
        <div className="h-12 bg-muted/50 border-b" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded ml-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (customers.length === 0) return null

  return (
    <div className="border rounded-md bg-card shadow-sm overflow-x-auto">
      <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow className="bg-primary/5 hover:bg-primary/5 border-b-2">
            <TableHead className="w-[100px] font-semibold text-primary">Código</TableHead>
            <TableHead className="font-semibold text-primary">Nome Fantasia</TableHead>
            <TableHead className="font-semibold text-primary">CNPJ/CPF</TableHead>
            <TableHead className="font-semibold text-primary">Telefone</TableHead>
            <TableHead className="font-semibold text-primary">Email</TableHead>
            <TableHead className="font-semibold text-primary">Status</TableHead>
            <TableHead className="text-right font-semibold text-primary">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow
              key={customer.id}
              className="group transition-colors even:bg-muted/30 hover:bg-accent/10 cursor-default"
            >
              <TableCell className="font-medium text-muted-foreground">{customer.code}</TableCell>
              <TableCell>
                <div className="font-medium">{customer.tradeName || customer.name}</div>
                {customer.tradeName && (
                  <div className="text-xs text-muted-foreground">{customer.name}</div>
                )}
              </TableCell>
              <TableCell>{customer.document}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {customer.mobile || customer.phone ? (
                    <>
                      <Phone className="h-3 w-3" /> {customer.mobile || customer.phone}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {customer.email ? (
                    <>
                      <Mail className="h-3 w-3" /> {customer.email}
                    </>
                  ) : (
                    '-'
                  )}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge status={customer.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  className="transition-colors min-h-[44px] min-w-[44px] hover:bg-muted"
                >
                  <Link to={`/clientes/${customer.id}`}>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="sr-only">Ver detalhes</span>
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
