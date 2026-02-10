import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const RelatoriosPage = () => {
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [distribuicao, setDistribuicao] = useState([]);
  const [projecao, setProjecao] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fluxoRes, distRes, projRes] = await Promise.all([
        api.get('/api/dashboards/fluxo-caixa').catch(() => ({ data: [] })),
        api.get('/api/dashboards/distribuicao-categorias').catch(() => ({ data: [] })),
        api.get('/api/dashboards/projecao-futura').catch(() => ({ data: [] }))
      ]);
      setFluxoCaixa(fluxoRes.data || []);
      setDistribuicao(distRes.data || []);
      setProjecao(projRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar relatorios:', error);
      setFluxoCaixa([]);
      setDistribuicao([]);
      setProjecao([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatMes = (mesStr) => {
    const [ano, mes] = mesStr.split('-');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano.slice(2)}`;
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exportado!');
  };

  const COLORS = ['hsl(217, 91%, 60%)', 'hsl(158, 64%, 52%)', 'hsl(343, 87%, 60%)', 'hsl(38, 92%, 50%)'];

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
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground mt-2">Visualize seus dados financeiros</p>
        </div>

        <Tabs defaultValue="fluxo" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="fluxo">Fluxo</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="projecao">Projeção</TabsTrigger>
          </TabsList>

          <TabsContent value="fluxo" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Fluxo de Caixa - Últimos 6 Meses</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(fluxoCaixa, 'fluxo_caixa')}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {fluxoCaixa.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Sem dados</p>
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tickFormatter={formatMes} stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="entradas" stroke="hsl(158, 64%, 52%)" strokeWidth={2} name="Entradas" />
                    <Line type="monotone" dataKey="saidas" stroke="hsl(343, 87%, 60%)" strokeWidth={2} name="Saídas" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="categorias" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Distribuição por Categorias</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(distribuicao, 'categorias')}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            {distribuicao.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
                <p className="text-muted-foreground">Sem dados</p>
              </div>
            ) : (
              <div className="bg-card border border-border/50 rounded-xl p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={distribuicao}
                      dataKey="valor_gasto"
                      nameKey="categoria"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label
                    >
                      {distribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          <TabsContent value="projecao" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Projeção Próximos 6 Meses</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(projecao, 'projecao')}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6">
              {projecao.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Cadastre recorrências para ver projeção</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={projecao}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="mes" tickFormatter={formatMes} stroke="hsl(var(--foreground))" />
                    <YAxis stroke="hsl(var(--foreground))" />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="entradas_previstas" stroke="hsl(158, 64%, 52%)" strokeWidth={2} name="Entradas" />
                    <Line type="monotone" dataKey="saidas_previstas" stroke="hsl(343, 87%, 60%)" strokeWidth={2} name="Saídas" />
                    <Line type="monotone" dataKey="saldo_projetado" stroke="hsl(217, 91%, 60%)" strokeWidth={3} name="Saldo" strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
