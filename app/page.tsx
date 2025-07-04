"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, TooltipProps } from "recharts"
import { RefreshCw, Trophy, TrendingUp, Users, Calendar, AlertTriangle, ListChecks, ExternalLink } from "lucide-react"

// Interfaces
interface Developer {
  name: string;
  inDevelopment: number;
  completed: number;
  score: number;
  position?: number;
  completed_baixo: number;
  completed_medio: number;
  completed_alta: number;
}

interface InProgressWorkItem {
  id: number;
  title: string;
  dev: string;
  qa: string;
  complexity: string;
}

interface DetailedWorkItem extends InProgressWorkItem {
  resolvedDate: string;
}

interface EvolutionDataEntry {
  date: string;
  [developer: string]: number | string;
}

interface ApiResponse {
  developers: Omit<Developer, 'position'>[];
  evolutionData: EvolutionDataEntry[];
  detailedWorkItems: DetailedWorkItem[];
  inProgressWorkItems: InProgressWorkItem[];
}

const initialData: { 
    developers: Developer[], 
    evolutionData: EvolutionDataEntry[], 
    detailedWorkItems: DetailedWorkItem[],
    inProgressWorkItems: InProgressWorkItem[]
} = {
  developers: [],
  evolutionData: [],
  detailedWorkItems: [],
  inProgressWorkItems: [],
}

// ✅ CORREÇÃO: Interface customizada para as propriedades do Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-white">
        <p className="label font-bold text-blue-400">{`${label}`}</p>
        <div>
          {payload.map((pld) => (
            <div key={pld.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: pld.color }}>{`${pld.name}: `}</span>
              <span className="ml-2 font-semibold" style={{ color: pld.name === 'Alta' ? '#FFFFFF' : '#d1d5db' }}>{pld.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};


export default function AzureDevOpsDashboard() {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const lineColors = ["#2563eb", "#16a34a", "#f97316", "#ef4444", "#8b5cf6", "#d946ef", "#0891b2", "#65a30d"];

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/dev-stats");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Falha ao buscar os dados da API interna.");
      }

      const newData: ApiResponse = await response.json();

      const sortedDevelopers = [...newData.developers]
        .sort((a, b) => b.score - a.score)
        .map((dev, index) => ({ ...dev, position: index + 1 }));

      setData({ ...newData, developers: sortedDevelopers });
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido.");
      }
      setData(initialData);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [])

  const currentLeader = data.developers.length > 0 ? data.developers[0] : null;

  const formatDate = (date: string) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-center p-4">
        <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-black mb-2">Oops! Algo deu errado.</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <Button onClick={fetchData} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-black text-white p-6 border-b">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-blue-400">Painel de Chamados Resolvidos</h1>
              <p className="text-gray-300 mt-2">Acompanhamento da Sprint Livre - Azure DevOps</p>
            </div>
            <Button onClick={fetchData} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {isLoading ? "Atualizando..." : "Atualizar"}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Pontuação do Líder</p>
                    <p className="text-2xl font-bold text-white">{isLoading ? "..." : (currentLeader?.score ?? 0)}</p>
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
                    <p className="text-lg font-bold text-white">{isLoading ? "..." : (currentLeader?.name ?? "N/A")}</p>
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
                    <p className="text-2xl font-bold text-white">{isLoading ? "..." : data.developers.length}</p>
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
                      {lastUpdated ? lastUpdated.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "..."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-8">
        {isLoading && data.developers.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2"><Trophy className="w-5 h-5 text-blue-600" /><span>Ranking de Desenvolvedores</span></CardTitle>
                  <CardDescription className="text-gray-600">Classificação por pontuação de chamados concluídos</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-black font-semibold">Posição</TableHead>
                        <TableHead className="text-black font-semibold">Desenvolvedor</TableHead>
                        <TableHead className="text-black font-semibold text-center">Concluídos</TableHead>
                        <TableHead className="text-black font-semibold text-right">Pontuação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.developers.map((dev, index) => (
                        <TableRow key={dev.name} className={index === 0 ? "bg-blue-50" : ""}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-2">
                              <span className={`text-lg ${index === 0 ? "text-blue-600 font-bold" : "text-black"}`}>{dev.position}º</span>
                              {index === 0 && <Trophy className="w-4 h-4 text-blue-600" />}
                            </div>
                          </TableCell>
                          <TableCell className={`${index === 0 ? "font-bold text-blue-600" : "text-black"}`}>{dev.name}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-gray-100 text-black">
                              {dev.completed}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={index === 0 ? "default" : "secondary"} className={index === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-black"}>
                              {dev.score}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              <Card className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2"><BarChart className="w-5 h-5 text-blue-600" /><span>Concluídos por Complexidade</span></CardTitle>
                  <CardDescription className="text-gray-600">Distribuição dos chamados concluídos por desenvolvedor.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.developers} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#000" }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#000" }} width={120} />
                      <Tooltip cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} content={<CustomTooltip />} />
                      <Legend />
                      <Bar dataKey="completed_alta" stackId="a" fill="#16a34a" name="Alta" />
                      <Bar dataKey="completed_medio" stackId="a" fill="#1f2937" name="Média" />
                      <Bar dataKey="completed_baixo" stackId="a" fill="#2563eb" name="Baixa" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-black flex items-center space-x-2"><ListChecks className="w-5 h-5 text-green-600" /><span>Chamados Resolvidos Detalhados</span></CardTitle>
                        <CardDescription className="text-gray-600">Lista das últimas User Stories concluídas.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-black font-semibold">Chamado</TableHead>
                                    <TableHead className="text-black font-semibold">Desenvolvedor</TableHead>
                                    <TableHead className="text-black font-semibold">Complexidade</TableHead>
                                    <TableHead className="text-black font-semibold text-center">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.detailedWorkItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-black max-w-xs truncate" title={item.title}>
                                            {`#${item.id} - ${item.title}`}
                                        </TableCell>
                                        <TableCell className="text-black">{item.dev}</TableCell>
                                        <TableCell><Badge variant="outline">{item.complexity}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <a href={`https://dev.azure.com/devPracticar/TMB%20Educação/_workitems/edit/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                            <ExternalLink className="w-4 h-4 inline-block"/>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-black flex items-center space-x-2"><ListChecks className="w-5 h-5 text-orange-500" /><span>Chamados em Andamento</span></CardTitle>
                        <CardDescription className="text-gray-600">Lista de chamados que não estão concluídos ou em 'Nova'.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-black font-semibold">Chamado</TableHead>
                                    <TableHead className="text-black font-semibold">Desenvolvedor</TableHead>
                                    <TableHead className="text-black font-semibold">Complexidade</TableHead>
                                    <TableHead className="text-black font-semibold text-center">Link</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.inProgressWorkItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium text-black max-w-xs truncate" title={item.title}>
                                            {`#${item.id} - ${item.title}`}
                                        </TableCell>
                                        <TableCell className="text-black">{item.dev}</TableCell>
                                        <TableCell><Badge variant="outline">{item.complexity}</Badge></TableCell>
                                        <TableCell className="text-center">
                                            <a href={`https://dev.azure.com/devPracticar/TMB%20Educação/_workitems/edit/${item.id}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                                            <ExternalLink className="w-4 h-4 inline-block"/>
                                            </a>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-gray-200">
              <CardHeader>
                  <CardTitle className="text-black flex items-center space-x-2"><TrendingUp className="w-5 h-5 text-blue-600" /><span>Evolução Diária por Desenvolvedor</span></CardTitle>
                  <CardDescription className="text-gray-600">Chamados concluídos por dia para cada desenvolvedor.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={data.evolutionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#000" }} tickFormatter={formatDate} />
                      <YAxis tick={{ fontSize: 12, fill: "#000" }} allowDecimals={false} />
                      <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "none", borderRadius: "8px", color: "#fff" }} labelFormatter={(value) => `Data: ${formatDate(value)}`}/>
                      <Legend />
                      {data.developers.map((dev, index) => (
                        <Line
                            key={dev.name}
                            type="monotone"
                            dataKey={dev.name}
                            name={dev.name}
                            stroke={lineColors[index % lineColors.length]}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                      ))}
                  </LineChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>  
  )
}