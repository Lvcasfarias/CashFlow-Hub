import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const RelatoriosPage = () => {
  const [fluxoCaixa, setFluxoCaixa] = useState([]);
  const [distribuicao, setDistribuicao] = useState([]);
  const [evolucaoDividas, setEvolucaoDividas] = useState([]);
  const [projecao, setProjecao] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [fluxoRes, distRes, dividasRes, projRes] = await Promise.all([
        api.get('/api/dashboards/fluxo-caixa'),
        api.get('/api/dashboards/distribuicao-categorias'),
        api.get('/api/dashboards/evolucao-dividas'),
        api.get('/api/dashboards/projecao-futura')
      ]);
      
      setFluxoCaixa(fluxoRes.data);
      setDistribuicao(distRes.data);
      setEvolucaoDividas(dividasRes.data);
      setProjecao(projRes.data);
    } catch (error) {
      toast.error('Erro ao carregar relatórios');
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
    ].join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Relatório exportado com sucesso!');
  };

  const COLORS = ['hsl(217, 91%, 60%)', 'hsl(158, 64%, 52%)', 'hsl(343, 87%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

  if (loading) {
    return (
      <Layout>
        <div className=\"flex items-center justify-center h-96\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary\"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=\"space-y-8\" data-testid=\"relatorios-page\">
        <div>
          <h1 className=\"text-4xl md:text-5xl font-bold tracking-tight\">Relatórios e Análises</h1>
          <p className=\"text-muted-foreground mt-2\">Visualize seus dados financeiros em gráficos</p>
        </div>

        <Tabs defaultValue=\"fluxo\" className=\"w-full\">
          <TabsList className=\"grid w-full max-w-2xl grid-cols-4\">
            <TabsTrigger value=\"fluxo\">Fluxo</TabsTrigger>
            <TabsTrigger value=\"categorias\">Categorias</TabsTrigger>
            <TabsTrigger value=\"dividas\">Dívidas</TabsTrigger>
            <TabsTrigger value=\"projecao\">Projeção</TabsTrigger>
          </TabsList>

          {/* Fluxo de Caixa */}
          <TabsContent value=\"fluxo\" className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex items-center gap-2\">
                <TrendingUp className=\"w-5 h-5 text-primary\" />
                <h2 className=\"text-2xl font-semibold\">Fluxo de Caixa - Últimos 6 Meses</h2>
              </div>
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => exportToCSV(fluxoCaixa, 'fluxo_caixa')}
                data-testid=\"export-fluxo-btn\"
              >
                <Download className=\"w-4 h-4 mr-2\" />
                Exportar CSV
              </Button>
            </div>

            {fluxoCaixa.length === 0 ? (
              <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
                <TrendingUp className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                <p className=\"text-muted-foreground\">Nenhum dado de fluxo de caixa disponível</p>
              </div>
            ) : (
              <div className=\"bg-card border border-border/50 rounded-xl p-6\">
                <ResponsiveContainer width=\"100%\" height={400}>
                  <LineChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray=\"3 3\" stroke=\"hsl(var(--border))\" />
                    <XAxis 
                      dataKey=\"mes\" 
                      tickFormatter={formatMes}
                      stroke=\"hsl(var(--foreground))\"
                    />
                    <YAxis 
                      stroke=\"hsl(var(--foreground))\"
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        color: 'hsl(var(--foreground))'
                      }}
                      formatter={(value) => formatCurrency(value)}
                      labelFormatter={formatMes}
                    />
                    <Legend />
                    <Line 
                      type=\"monotone\" 
                      dataKey=\"entradas\" 
                      stroke=\"hsl(158, 64%, 52%)\" 
                      strokeWidth={2}
                      name=\"Entradas\"
                      dot={{ fill: 'hsl(158, 64%, 52%)' }}
                    />
                    <Line 
                      type=\"monotone\" 
                      dataKey=\"saidas\" 
                      stroke=\"hsl(343, 87%, 60%)\" 
                      strokeWidth={2}
                      name=\"Saídas\"
                      dot={{ fill: 'hsl(343, 87%, 60%)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Distribuição por Categorias */}
          <TabsContent value=\"categorias\" className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex items-center gap-2\">
                <PieChartIcon className=\"w-5 h-5 text-primary\" />
                <h2 className=\"text-2xl font-semibold\">Distribuição por Categorias</h2>
              </div>
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => exportToCSV(distribuicao, 'distribuicao_categorias')}
                data-testid=\"export-categorias-btn\"
              >
                <Download className=\"w-4 h-4 mr-2\" />
                Exportar CSV
              </Button>
            </div>

            {distribuicao.length === 0 ? (
              <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
                <PieChartIcon className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                <p className=\"text-muted-foreground\">Nenhum dado de distribuição disponível</p>
              </div>
            ) : (
              <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
                <div className=\"bg-card border border-border/50 rounded-xl p-6\">
                  <h3 className=\"text-lg font-semibold mb-4\">Gastos Realizados</h3>
                  <ResponsiveContainer width=\"100%\" height={300}>
                    <PieChart>
                      <Pie
                        data={distribuicao}
                        dataKey=\"valor_gasto\"
                        nameKey=\"categoria\"
                        cx=\"50%\"
                        cy=\"50%\"
                        outerRadius={100}
                        label={({ categoria, percent }) => `${categoria} ${(percent * 100).toFixed(0)}%`}
                      >
                        {distribuicao.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className=\"bg-card border border-border/50 rounded-xl p-6\">
                  <h3 className=\"text-lg font-semibold mb-4\">Planejado vs Realizado</h3>
                  <div className=\"space-y-4\">
                    {distribuicao.map((item, index) => (
                      <div key={index} className=\"space-y-2\">
                        <div className=\"flex justify-between items-center\">
                          <span className=\"font-medium\">{item.categoria}</span>
                          <span className=\"text-sm text-muted-foreground\">
                            {item.planejado}% planejado • {parseFloat(item.realizado).toFixed(1)}% realizado
                          </span>
                        </div>
                        <div className=\"flex gap-2 h-2\">
                          <div 
                            className=\"bg-primary/30 rounded-full\" 
                            style={{ width: `${item.planejado}%` }}
                          />
                          <div 
                            className=\"bg-primary rounded-full\" 
                            style={{ width: `${item.realizado}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Evolução de Dívidas */}
          <TabsContent value=\"dividas\" className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex items-center gap-2\">
                <BarChart3 className=\"w-5 h-5 text-primary\" />
                <h2 className=\"text-2xl font-semibold\">Evolução de Dívidas</h2>
              </div>
            </div>

            {evolucaoDividas.length === 0 ? (
              <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
                <BarChart3 className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                <p className=\"text-muted-foreground\">Nenhuma dívida cadastrada</p>
              </div>
            ) : (
              <div className=\"space-y-4\">
                {evolucaoDividas.map((divida) => {
                  const amortizacoes = JSON.parse(divida.amortizacoes || '[]');
                  if (amortizacoes.length === 0) return null;

                  const dadosGrafico = amortizacoes.map((amort, index) => ({
                    data: new Date(amort.data).toLocaleDateString('pt-BR'),
                    valor_restante: divida.valor_original - amortizacoes.slice(0, index + 1).reduce((sum, a) => sum + parseFloat(a.valor), 0)
                  }));

                  dadosGrafico.unshift({
                    data: new Date(divida.data_inicio).toLocaleDateString('pt-BR'),
                    valor_restante: divida.valor_original
                  });

                  return (
                    <div key={divida.id} className=\"bg-card border border-border/50 rounded-xl p-6\">
                      <h3 className=\"text-lg font-semibold mb-4\">{divida.descricao}</h3>
                      <ResponsiveContainer width=\"100%\" height={250}>
                        <BarChart data={dadosGrafico}>
                          <CartesianGrid strokeDasharray=\"3 3\" stroke=\"hsl(var(--border))\" />
                          <XAxis 
                            dataKey=\"data\"
                            stroke=\"hsl(var(--foreground))\"
                          />
                          <YAxis 
                            stroke=\"hsl(var(--foreground))\"
                            tickFormatter={(value) => formatCurrency(value)}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              color: 'hsl(var(--foreground))'
                            }}
                            formatter={(value) => formatCurrency(value)}
                          />
                          <Bar dataKey=\"valor_restante\" fill=\"hsl(343, 87%, 60%)\" name=\"Saldo Devedor\" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Projeção Futura */}
          <TabsContent value=\"projecao\" className=\"space-y-4\">
            <div className=\"flex items-center justify-between\">
              <div className=\"flex items-center gap-2\">
                <Calendar className=\"w-5 h-5 text-primary\" />
                <h2 className=\"text-2xl font-semibold\">Projeção Próximos 6 Meses</h2>
              </div>
              <Button
                variant=\"outline\"
                size=\"sm\"
                onClick={() => exportToCSV(projecao, 'projecao_futura')}
                data-testid=\"export-projecao-btn\"
              >
                <Download className=\"w-4 h-4 mr-2\" />
                Exportar CSV
              </Button>
            </div>

            <div className=\"bg-card border border-border/50 rounded-xl p-6\">
              <p className=\"text-sm text-muted-foreground mb-6\">
                Baseado nas suas contas fixas e parcelas já cadastradas
              </p>
              
              {projecao.length === 0 ? (
                <div className=\"text-center py-12\">
                  <Calendar className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                  <p className=\"text-muted-foreground\">Cadastre recorrências para ver a projeção</p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width=\"100%\" height={400}>
                    <LineChart data={projecao}>
                      <CartesianGrid strokeDasharray=\"3 3\" stroke=\"hsl(var(--border))\" />
                      <XAxis 
                        dataKey=\"mes\" 
                        tickFormatter={formatMes}
                        stroke=\"hsl(var(--foreground))\"
                      />
                      <YAxis 
                        stroke=\"hsl(var(--foreground))\"
                        tickFormatter={(value) => formatCurrency(value)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))'
                        }}
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={formatMes}
                      />
                      <Legend />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"entradas_previstas\" 
                        stroke=\"hsl(158, 64%, 52%)\" 
                        strokeWidth={2}
                        name=\"Entradas Previstas\"
                      />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"saidas_previstas\" 
                        stroke=\"hsl(343, 87%, 60%)\" 
                        strokeWidth={2}
                        name=\"Saídas Previstas\"
                      />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"saldo_projetado\" 
                        stroke=\"hsl(217, 91%, 60%)\" 
                        strokeWidth={3}
                        name=\"Saldo Projetado\"
                        strokeDasharray=\"5 5\"
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4 mt-6\">
                    {projecao.map((mes, index) => {
                      const isPositivo = mes.saldo_projetado >= 0;
                      return (
                        <div key={index} className=\"bg-secondary/20 rounded-lg p-4\">
                          <p className=\"text-sm text-muted-foreground mb-1\">{formatMes(mes.mes)}</p>
                          <p className={`text-xl font-bold font-mono ${isPositivo ? 'text-green-500' : 'text-red-500'}`}>
                            {formatCurrency(mes.saldo_projetado)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
