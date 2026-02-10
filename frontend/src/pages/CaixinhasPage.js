import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useBalance } from '../context/BalanceContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Settings, Trash2, DollarSign, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';

export const CaixinhasPage = () => {
  const { refreshBalance } = useBalance();
  const [caixinhas, setCaixinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openConfig, setOpenConfig] = useState(false);
  const [openDistribuir, setOpenDistribuir] = useState(false);
  const [openDeleteConfirm, setOpenDeleteConfirm] = useState(false);
  const [caixinhaToDelete, setCaixinhaToDelete] = useState(null);
  const [configCaixinhas, setConfigCaixinhas] = useState([
    { nome: 'Investimentos', porcentagem: 30 },
    { nome: 'Conhecimento', porcentagem: 15 },
    { nome: 'Custos', porcentagem: 55 },
  ]);
  const [valorDistribuir, setValorDistribuir] = useState('');

  useEffect(() => {
    fetchCaixinhas();
  }, []);

  const fetchCaixinhas = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const response = await api.get(`/api/caixinhas?mes=${mesAtual}`).catch(() => ({ data: [] }));
      setCaixinhas(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao carregar caixinhas:', error);
      setCaixinhas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarConfig = async () => {
    const total = configCaixinhas.reduce((sum, c) => sum + parseFloat(c.porcentagem || 0), 0);
    
    if (Math.abs(total - 100) > 0.01) {
      toast.error('A soma das porcentagens deve ser 100%');
      return;
    }

    try {
      await api.post('/api/caixinhas/configurar', {
        caixinhas: configCaixinhas,
        mesReferencia: new Date().toISOString().slice(0, 7),
      });
      toast.success('Caixinhas configuradas!');
      setOpenConfig(false);
      fetchCaixinhas();
      refreshBalance();
    } catch (error) {
      console.error('Erro ao configurar:', error);
      toast.error('Erro ao configurar caixinhas');
    }
  };

  const handleDistribuir = async () => {
    const valor = parseFloat(valorDistribuir);
    
    if (!valor || valor <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    try {
      await api.post('/api/caixinhas/distribuir', {
        valor,
        mesReferencia: new Date().toISOString().slice(0, 7),
      });
      toast.success(`R$ ${valor.toFixed(2)} distribuído entre as caixinhas!`);
      setOpenDistribuir(false);
      setValorDistribuir('');
      fetchCaixinhas();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao distribuir valor');
    }
  };

  const adicionarCaixinha = () => {
    setConfigCaixinhas([...configCaixinhas, { nome: '', porcentagem: 0 }]);
  };

  const removerCaixinha = (index) => {
    const novas = configCaixinhas.filter((_, i) => i !== index);
    setConfigCaixinhas(novas);
  };

  const atualizarCaixinha = (index, field, value) => {
    const novas = [...configCaixinhas];
    novas[index][field] = value;
    setConfigCaixinhas(novas);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const totalPorcentagem = configCaixinhas.reduce((sum, c) => sum + parseFloat(c.porcentagem || 0), 0);

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
      <div className="space-y-8" data-testid="caixinhas-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Caixinhas</h1>
            <p className="text-muted-foreground mt-2">Gerencie seu orçamento por categorias</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={openConfig} onOpenChange={setOpenConfig}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="config-caixinhas-btn">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Configurar Caixinhas</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Defina as porcentagens que serão distribuídas automaticamente quando você adicionar uma entrada.
                  </p>
                  
                  {configCaixinhas.map((caixinha, index) => (
                    <div key={index} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <Label>Nome da Caixinha</Label>
                        <Input
                          value={caixinha.nome}
                          onChange={(e) => atualizarCaixinha(index, 'nome', e.target.value)}
                          placeholder="Ex: Investimentos"
                          data-testid={`caixinha-nome-${index}`}
                        />
                      </div>
                      <div className="w-32">
                        <Label>Porcentagem</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={caixinha.porcentagem}
                          onChange={(e) => atualizarCaixinha(index, 'porcentagem', e.target.value)}
                          placeholder="0"
                          data-testid={`caixinha-porcentagem-${index}`}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removerCaixinha(index)}
                        disabled={configCaixinhas.length === 1}
                        data-testid={`remove-caixinha-${index}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    onClick={adicionarCaixinha}
                    className="w-full"
                    data-testid="add-caixinha-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Caixinha
                  </Button>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className={`font-bold text-lg ${Math.abs(totalPorcentagem - 100) < 0.01 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalPorcentagem.toFixed(2)}%
                      </span>
                    </div>
                    {Math.abs(totalPorcentagem - 100) > 0.01 && (
                      <p className="text-sm text-red-500 mt-2">A soma deve ser exatamente 100%</p>
                    )}
                  </div>

                  <Button
                    onClick={handleSalvarConfig}
                    className="w-full"
                    data-testid="save-config-btn"
                  >
                    Salvar Configuração
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openDistribuir} onOpenChange={setOpenDistribuir}>
              <DialogTrigger asChild>
                <Button data-testid="distribuir-btn">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Distribuir Entrada
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Distribuir Entrada</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <p className="text-sm text-muted-foreground">
                    Digite o valor da entrada (ex: salário) para distribuir automaticamente entre as caixinhas.
                  </p>
                  
                  <div>
                    <Label>Valor da Entrada (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={valorDistribuir}
                      onChange={(e) => setValorDistribuir(e.target.value)}
                      placeholder="0,00"
                      data-testid="valor-distribuir-input"
                    />
                  </div>

                  {valorDistribuir && parseFloat(valorDistribuir) > 0 && caixinhas.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-2 bg-secondary/20">
                      <p className="text-sm font-semibold mb-3">Prévia da distribuição:</p>
                      {caixinhas.map((caixinha) => {
                        const valor = (parseFloat(valorDistribuir) * caixinha.porcentagem_alvo) / 100;
                        return (
                          <div key={caixinha.id} className="flex justify-between text-sm">
                            <span>{caixinha.nome_caixinha} ({caixinha.porcentagem_alvo}%)</span>
                            <span className="font-mono font-semibold text-green-500">
                              +{formatCurrency(valor)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <Button
                    onClick={handleDistribuir}
                    className="w-full"
                    data-testid="confirm-distribuir-btn"
                  >
                    Confirmar Distribuição
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {caixinhas.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <Settings className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma caixinha configurada</h3>
            <p className="text-muted-foreground mb-6">
              Configure suas caixinhas para começar a organizar suas finanças
            </p>
            <Button onClick={() => setOpenConfig(true)} data-testid="empty-config-btn">
              <Settings className="w-4 h-4 mr-2" />
              Configurar Caixinhas
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {caixinhas.map((caixinha) => {
              const percentualGasto = caixinha.valor_alocado > 0
                ? (caixinha.valor_gasto / caixinha.valor_alocado) * 100
                : 0;
              const isNegative = parseFloat(caixinha.saldo_disponivel) < 0;
              const isOverBudget = percentualGasto > 100;
              
              // Alertas de cor baseados no percentual gasto
              let progressColor = 'bg-primary';
              let borderColor = 'border-border/50';
              if (isNegative || percentualGasto > 100) {
                progressColor = 'bg-red-500';
                borderColor = 'border-red-500/50';
              } else if (percentualGasto >= 95) {
                progressColor = 'bg-orange-500';
                borderColor = 'border-orange-500/50';
              } else if (percentualGasto >= 80) {
                progressColor = 'bg-yellow-500';
                borderColor = 'border-yellow-500/50';
              }

              return (
                <div
                  key={caixinha.id}
                  className={`bg-card border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${borderColor}`}
                  data-testid={`caixinha-card-${caixinha.id}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{caixinha.nome_caixinha}</h3>
                    <span className="text-sm font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                      {caixinha.porcentagem_alvo}%
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Saldo Disponível</p>
                      <p className={`text-3xl font-bold font-mono tracking-tight ${
                        isNegative ? 'text-red-500' : 'text-foreground'
                      }`}>
                        {formatCurrency(caixinha.saldo_disponivel)}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Alocado</span>
                        <span className="font-mono font-medium">{formatCurrency(caixinha.valor_alocado)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Gasto</span>
                        <span className="font-mono font-medium text-red-500">
                          {formatCurrency(caixinha.valor_gasto)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Utilizado</span>
                        <span className={`font-semibold ${isOverBudget ? 'text-red-500' : 'text-muted-foreground'}`}>
                          {Math.min(percentualGasto, 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(percentualGasto, 100)}
                        className={`h-2 ${isNegative ? 'bg-red-500/20' : ''}`}
                        indicatorClassName={progressColor}
                      />
                      {isOverBudget && (
                        <p className="text-xs text-red-500 font-medium">
                          ⚠️ Orçamento estourado em {(percentualGasto - 100).toFixed(1)}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};
