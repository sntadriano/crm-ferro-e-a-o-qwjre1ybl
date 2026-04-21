import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao CRM Plus</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Gestão de Clientes
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Acesse a base completa de clientes, crie novos registros ou importe planilhas.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button asChild variant="secondary" className="w-full justify-between">
              <Link to="/clientes">
                Acessar Módulo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
