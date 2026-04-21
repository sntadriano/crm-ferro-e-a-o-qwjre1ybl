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
      <div className="border rounded-md animate-pulse">
        <div className="h-12 bg-muted/50 border-b" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b flex items-center px-4 gap-4">
            <div className="h-4 w-20 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded ml-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="border rounded-md p-12 text-center bg-card">
        <p className="text-muted-foreground">Nenhum cliente encontrado com os filtros atuais.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-md bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[100px]">Código</TableHead>
            <TableHead>Nome / Fantasia</TableHead>
            <TableHead>CNPJ/CPF</TableHead>
            <TableHead>Contato</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.id} className="group transition-colors">
              <TableCell className="font-medium text-muted-foreground">{customer.code}</TableCell>
              <TableCell>
                <div className="font-medium">{customer.tradeName || customer.name}</div>
                {customer.tradeName && (
                  <div className="text-xs text-muted-foreground">{customer.name}</div>
                )}
              </TableCell>
              <TableCell>{customer.document}</TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-sm">
                  {customer.mobile && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3" /> {customer.mobile}
                    </span>
                  )}
                  {customer.email && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Mail className="h-3 w-3" /> {customer.email}
                    </span>
                  )}
                  {!customer.mobile && !customer.email && '-'}
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
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Link to={`/clientes/${customer.id}`}>
                    <Eye className="h-4 w-4" />
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
