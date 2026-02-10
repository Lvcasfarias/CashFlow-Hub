import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { BarChart3, TrendingUp, PieChart, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'];

export const RelatoriosPage = () => {
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [distribuicao, setDistribuicao] = useState([]);
  const [projecao, setProjecao] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('6');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      let fluxoUrl = `/api/dashboards/fluxo-caixa?meses=${periodo}`;
      let projecaoUrl = `/api/dashboards/projecao-futura?meses=${periodo}`;
      
      if (dataInicio && dataFim) {
        fluxoUrl = `/api/dashboards/fluxo-caixa?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      }
      
      const [fluxoRes, distRes, projRes] = await Promise.all([
        api.get(fluxoUrl).catch(err => {
          console.error('Erro fluxo:', err);
          return { data: [] };
        }),
        api.get('/api/dashboards/distribuicao-categorias').catch(err => {
          console.error('Erro distribuicao:', err);
          return { data: [] };
        }),
        api.get(projecaoUrl).catch(err => {
          console.error('Erro projecao:', err);
          return { data: [] };
        })
      ]);
      
      setFluxoCaixa(Array.isArray(fluxoRes.data) ? fluxoRes.data : []);
      setDistribuicao(Array.isArray(distRes.data) ? distRes.data : []);
      setProjecao(Array.isArray(projRes.data) ? projRes.data : []);
    } catch (error) {
      console.error('Erro ao carregar relatorios:', error);
      setFluxoCaixa([]);
      setDistribuicao([]);
      setProjecao([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = () => {
    fetchData();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(value || 0);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8" data-testid="relatorios-page">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Relatorios</h1>
            <p className="text-muted-foreground mt-2">Analise suas financas</p>
          </div>
        </div>

        {/* Filtros de Periodo */}
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs">Periodo Rapido</Label>
              <Select value={periodo} onValueChange={(value) => { setPeriodo(value); setDataInicio(''); setDataFim(''); }}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Ultimos 3 meses</SelectItem>
                  <SelectItem value="6">Ultimos 6 meses</SelectItem>
                  <SelectItem value="12">Ultimo ano</SelectItem>
                  <SelectItem value="24">Ultimos 2 anos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground">ou</div>
            <div>
              <Label className="text-xs">Data Inicio</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={handleFiltrar}>
              <Filter className="w-4 h-4 mr-2" />
              Aplicar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fluxo de Caixa */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Fluxo de Caixa</h2>
            </div>
            {fluxoCaixa.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={fluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="entradas" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981' }}
                    name="Entradas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saidas" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444' }}
                    name="Saidas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="saldo" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6' }}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Distribuicao por Categoria */}
          <div className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <PieChart className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Distribuicao por Caixinha</h2>
            </div>
            {distribuicao.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={distribuicao}
                    dataKey="valor"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {distribuicao.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </div>

          {/* Projecao Futura */}
          <div className="bg-card border border-border/50 rounded-xl p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">Projecao Futura ({periodo} Meses)</h2>
            </div>
            {projecao.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Sem dados para projecao. Cadastre recorrencias para visualizar.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={projecao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="mes" 
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="entradas_previstas" fill="#10B981" name="Entradas Previstas" />
                  <Bar dataKey="saidas_previstas" fill="#EF4444" name="Saidas Previstas" />
                  <Bar dataKey="saldo_projetado" fill="#3B82F6" name="Saldo Projetado" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
