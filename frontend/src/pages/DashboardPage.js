import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { TrendingUp, TrendingDown, Wallet, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Progress } from '../components/ui/progress';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [caixinhas, setCaixinhas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      
      const [statsRes, caixinhasRes, transacoesRes] = await Promise.all([
        api.get(`/api/transacoes/estatisticas?mes=${mesAtual}`),
        api.get(`/api/caixinhas?mes=${mesAtual}`),
        api.get(`/api/transacoes?dataInicio=${mesAtual}-01&dataFim=${mesAtual}-31`)
      ]);

      setStats(statsRes.data);
      setCaixinhas(caixinhasRes.data);
      setTransacoes(transacoesRes.data.slice(0, 5));
    } catch (error) {
      toast.error('Erro ao carregar dados do dashboard');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
      <div className="space-y-8" data-testid="dashboard-page">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Visão geral das suas finanças</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border/50 rounded-xl p-6" data-testid="total-entradas-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Entradas</span>
                  <ArrowUpCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight" style={{ color: 'hsl(158 64% 52%)' }}>
                  {formatCurrency(stats?.total_entradas || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{stats?.num_entradas || 0} transações</p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6" data-testid="total-saidas-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Saídas</span>
                  <ArrowDownCircle className="w-5 h-5 text-red-500" />
                </div>
                <p className="text-3xl font-bold font-mono tracking-tight" style={{ color: 'hsl(343 87% 60%)' }}>
                  {formatCurrency(stats?.total_saidas || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">{stats?.num_saidas || 0} transações</p>
              </div>

              <div className="bg-card border border-border/50 rounded-xl p-6" data-testid="saldo-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Saldo</span>
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <p className={`text-3xl font-bold font-mono tracking-tight ${stats?.saldo >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(stats?.saldo || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">Mês atual</p>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6" data-testid="caixinhas-overview">
              <h3 className="text-xl font-semibold mb-4">Caixinhas do Mês</h3>
              
              {caixinhas.length === 0 ? (
                <div className="text-center py-8">
                  <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma caixinha configurada</p>
                  <p className="text-sm text-muted-foreground mt-1">Configure suas caixinhas para começar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {caixinhas.map((caixinha) => {
                    const percentual = caixinha.valor_alocado > 0 
                      ? Math.min((caixinha.valor_gasto / caixinha.valor_alocado) * 100, 100)
                      : 0;
                    const isNegative = parseFloat(caixinha.saldo_disponivel) < 0;
                    
                    return (
                      <div key={caixinha.id} className="space-y-2" data-testid={`caixinha-${caixinha.id}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{caixinha.nome_caixinha}</p>
                            <p className="text-sm text-muted-foreground">
                              {caixinha.porcentagem_alvo}% do orçamento
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-mono font-semibold ${isNegative ? 'text-red-500' : 'text-foreground'}`}>
                              {formatCurrency(caixinha.saldo_disponivel)}
                            </p>
                            <p className="text-sm text-muted-foreground font-mono">
                              {formatCurrency(caixinha.valor_gasto)} / {formatCurrency(caixinha.valor_alocado)}
                            </p>
                          </div>
                        </div>
                        <Progress 
                          value={percentual} 
                          className={`h-2 ${isNegative ? 'bg-red-500/20' : ''}`}
                          indicatorClassName={isNegative ? 'bg-red-500' : 'bg-primary'}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="bg-card border border-border/50 rounded-xl p-6" data-testid="recent-transactions">
              <h3 className="text-xl font-semibold mb-4">Transações Recentes</h3>
              
              {transacoes.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Nenhuma transação</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transacoes.map((transacao) => (
                    <div
                      key={transacao.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      data-testid={`transaction-${transacao.id}`}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">{transacao.descricao || 'Sem descrição'}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(transacao.data)}</p>
                        {transacao.nome_caixinha && (
                          <p className="text-xs text-muted-foreground mt-1">{transacao.nome_caixinha}</p>
                        )}
                      </div>
                      <p
                        className={`font-mono font-semibold ${
                          transacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {transacao.tipo === 'entrada' ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
