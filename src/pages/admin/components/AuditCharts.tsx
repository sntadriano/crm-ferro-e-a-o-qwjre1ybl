import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { AuditLog } from '@/services/audit_logs'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  logs: AuditLog[]
  loading: boolean
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
]

export function AuditCharts({ logs, loading }: Props) {
  const { userStats, actionStats, totals } = useMemo(() => {
    const uStats: Record<string, number> = {}
    const aStats: Record<string, number> = { CREATE: 0, UPDATE: 0, DELETE: 0 }
    const tStats: Record<string, number> = {}

    logs.forEach((log) => {
      const name = log.usuario_nome || 'System'
      uStats[name] = (uStats[name] || 0) + 1
      aStats[log.acao] = (aStats[log.acao] || 0) + 1
      tStats[log.tabela] = (tStats[log.tabela] || 0) + 1
    })

    return {
      userStats: Object.entries(uStats).map(([name, count]) => ({ name, count })),
      actionStats: Object.entries(aStats)
        .map(([name, count]) => ({ name, count }))
        .filter((d) => d.count > 0),
      totals: {
        users: Object.keys(uStats).length,
        actions: logs.length,
        tables: Object.keys(tStats).length,
      },
    }
  }, [logs])

  if (loading) return <Skeleton className="h-[300px] w-full" />

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.actions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tabelas Afetadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.tables}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Mudanças por Usuário</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ChartContainer config={{ count: { label: 'Mudanças', color: COLORS[0] } }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userStats}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mudanças por Ação</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            <ChartContainer config={{ count: { label: 'Ações' } }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={actionStats}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {actionStats.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
