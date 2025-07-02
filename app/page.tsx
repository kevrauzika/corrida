"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { RefreshCw, Trophy, TrendingUp, Users, Calendar } from "lucide-react"

// Dados mockados baseados na estrutura do Azure DevOps
const mockData = {
  developers: [
    { name: "Ana Silva", resolved: 23, position: 1 },
    { name: "Carlos Santos", resolved: 19, position: 2 },
    { name: "Maria Oliveira", resolved: 17, position: 3 },
    { name: "João Costa", resolved: 15, position: 4 },
    { name: "Pedro Lima", resolved: 12, position: 5 },
    { name: "Julia Ferreira", resolved: 10, position: 6 },
  ],
  timelineData: [
    { date: "2024-01-01", total: 5, Ana: 2, Carlos: 1, Maria: 1, João: 1, Pedro: 0, Julia: 0 },
    { date: "2024-01-02", total: 12, Ana: 4, Carlos: 3, Maria: 2, João: 2, Pedro: 1, Julia: 0 },
    { date: "2024-01-03", total: 25, Ana: 7, Carlos: 6, Maria: 4, João: 4, Pedro: 2, Julia: 2 },
    { date: "2024-01-04", total: 42, Ana: 12, Carlos: 9, Maria: 7, João: 6, Pedro: 4, Julia: 4 },
    { date: "2024-01-05", total: 65, Ana: 16, Carlos: 13, Maria: 11, João: 9, Pedro: 8, Julia: 8 },
    { date: "2024-01-06", total: 85, Ana: 20, Carlos: 16, Maria: 14, João: 12, Pedro: 10, Julia: 13 },
    { date: "2024-01-07", total: 96, Ana: 23, Carlos: 19, Maria: 17, João: 15, Pedro: 12, Julia: 10 },
  ],
}

export default function AzureDevOpsDashboard() {
  const [data, setData] = useState(mockData)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const totalResolved = data.developers.reduce((sum, dev) => sum + dev.resolved, 0)
  const currentLeader = data.developers[0]

  const refreshData = async () => {
    setIsLoading(true)
    // Simular chamada à API do Azure DevOps
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLastUpdated(new Date())
    setIsLoading(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black text-white p-6 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Painel de Chamados Resolvidos</h1>
              <p className="text-gray-300 mt-2">Acompanhamento da Sprint Livre - Azure DevOps</p>
            </div>
            <Button onClick={refreshData} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>

          {/* Indicadores Principais */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Total Resolvidos</p>
                    <p className="text-2xl font-bold text-white">{totalResolved}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Líder Atual</p>
                    <p className="text-lg font-bold text-white">{currentLeader.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Desenvolvedores</p>
                    <p className="text-2xl font-bold text-white">{data.developers.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Última Atualização</p>
                    <p className="text-sm text-white">
                      {lastUpdated.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tabela de Classificação */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-blue-600" />
                <span>Ranking de Desenvolvedores</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Classificação por chamados resolvidos</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black font-semibold">Posição</TableHead>
                    <TableHead className="text-black font-semibold">Desenvolvedor</TableHead>
                    <TableHead className="text-black font-semibold text-right">Chamados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.developers.map((dev, index) => (
                    <TableRow key={dev.name} className={index === 0 ? "bg-blue-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span className={`text-lg ${index === 0 ? "text-blue-600 font-bold" : "text-black"}`}>
                            {dev.position}º
                          </span>
                          {index === 0 && <Trophy className="w-4 h-4 text-blue-600" />}
                        </div>
                      </TableCell>
                      <TableCell className={`${index === 0 ? "font-bold text-blue-600" : "text-black"}`}>
                        {dev.name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={index === 0 ? "default" : "secondary"}
                          className={index === 0 ? "bg-blue-600 text-white" : "bg-gray-100 text-black"}
                        >
                          {dev.resolved}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Gráfico de Barras */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center space-x-2">
                <BarChart className="w-5 h-5 text-blue-600" />
                <span>Chamados por Desenvolvedor</span>
              </CardTitle>
              <CardDescription className="text-gray-600">Distribuição visual dos chamados resolvidos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.developers}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#000" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#000" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="resolved" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de Linha - Timeline */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-black flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Evolução dos Chamados Resolvidos</span>
            </CardTitle>
            <CardDescription className="text-gray-600">Progresso acumulado ao longo da Sprint Livre</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#000" }} tickFormatter={formatDate} />
                <YAxis tick={{ fontSize: 12, fill: "#000" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelFormatter={(value) => `Data: ${formatDate(value)}`}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: "#2563eb" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="text-center text-gray-600">
              <p className="text-sm">
                <strong>Fonte de Dados:</strong> Azure DevOps - View de Chamados Resolvidos
              </p>
              <p className="text-xs mt-2">
                Dashboard atualizado automaticamente. Última sincronização: {lastUpdated.toLocaleString("pt-BR")}
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
