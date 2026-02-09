import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, DollarSign, TrendingDown, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';

export const DividasPage = () => {
  const [dividas, setDividas] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAmortizar, setOpenAmortizar] = useState(false);
  const [dividaSelecionada, setDividaSelecionada] = useState(null);

  const [formDivida, setFormDivida] = useState({
    descricao: '',
    valorOriginal: '',
    jurosMensal: '0',
    dataInicio: new Date().toISOString().split('T')[0]
  });

  const [formAmortizar, setFormAmortizar] = useState({
    valor: '',
    dataPagamento: new Date().toISOString().split('T')[0],
    caixinhaId: '',
    observacao: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const [dividasRes, caixinhasRes, statsRes] = await Promise.all([
        api.get('/api/dividas'),
        api.get(`/api/caixinhas?mes=${mesAtual}`),
        api.get('/api/dividas/estatisticas/resumo')
      ]);
      setDividas(dividasRes.data);
      setCaixinhas(caixinhasRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dívidas');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/api/dividas', formDivida);
      toast.success('Dívida cadastrada com sucesso!');
      setOpenDialog(false);
      setFormDivida({
        descricao: '',
        valorOriginal: '',
        jurosMensal: '0',
        dataInicio: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar dívida');
    }
  };

  const handleAmortizar = async (e) => {
    e.preventDefault();
    
    if (!dividaSelecionada) return;

    try {
      await api.post(`/api/dividas/${dividaSelecionada.id}/amortizar`, {
        ...formAmortizar,
        caixinhaId: parseInt(formAmortizar.caixinhaId)
      });
      toast.success('Amortização registrada com sucesso!');
      setOpenAmortizar(false);
      setDividaSelecionada(null);
      setFormAmortizar({
        valor: '',
        dataPagamento: new Date().toISOString().split('T')[0],
        caixinhaId: '',
        observacao: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao amortizar dívida');
    }
  };

  const handleChangeStatus = async (id, status) => {
    try {
      await api.patch(`/api/dividas/${id}/status`, { status });
      toast.success('Status atualizado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const abrirAmortizacao = (divida) => {
    setDividaSelecionada(divida);
    setOpenAmortizar(true);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendente': return 'bg-red-500/20 text-red-500';
      case 'negociando': return 'bg-yellow-500/20 text-yellow-500';
      case 'quitado': return 'bg-green-500/20 text-green-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'negociando': return 'Negociando';
      case 'quitado': return 'Quitado';
      default: return status;
    }
  };

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
      <div className=\"space-y-8\" data-testid=\"dividas-page\">
        <div>
          <h1 className=\"text-4xl md:text-5xl font-bold tracking-tight\">Gestão de Dívidas</h1>
          <p className=\"text-muted-foreground mt-2\">Acompanhe e quite suas dívidas</p>
        </div>

        {stats && (
          <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
            <div className=\"bg-card border border-border/50 rounded-xl p-6\">
              <div className=\"flex items-center justify-between mb-2\">
                <span className=\"text-sm font-medium text-muted-foreground\">Total Devido</span>
                <AlertCircle className=\"w-5 h-5 text-red-500\" />
              </div>
              <p className=\"text-3xl font-bold font-mono text-red-500\">
                {formatCurrency(stats.total_devido || 0)}
              </p>
              <p className=\"text-xs text-muted-foreground mt-2\">
                {stats.pendentes || 0} pendentes • {stats.negociando || 0} negociando
              </p>
            </div>

            <div className=\"bg-card border border-border/50 rounded-xl p-6\">
              <div className=\"flex items-center justify-between mb-2\">
                <span className=\"text-sm font-medium text-muted-foreground\">Total Original</span>
                <TrendingDown className=\"w-5 h-5 text-muted-foreground\" />
              </div>
              <p className=\"text-3xl font-bold font-mono\">
                {formatCurrency(stats.total_original || 0)}
              </p>
              <p className=\"text-xs text-muted-foreground mt-2\">
                {stats.total_dividas || 0} dívidas cadastradas
              </p>
            </div>

            <div className=\"bg-card border border-border/50 rounded-xl p-6\">
              <div className=\"flex items-center justify-between mb-2\">
                <span className=\"text-sm font-medium text-muted-foreground\">Dívidas Quitadas</span>
                <span className=\"text-2xl font-bold text-green-500\">{stats.quitadas || 0}</span>
              </div>
              <Progress 
                value={stats.total_dividas > 0 ? (stats.quitadas / stats.total_dividas) * 100 : 0}
                className=\"h-2\"
                indicatorClassName=\"bg-green-500\"
              />
              <p className=\"text-xs text-muted-foreground mt-2\">
                {stats.total_dividas > 0 ? ((stats.quitadas / stats.total_dividas) * 100).toFixed(1) : 0}% concluído
              </p>
            </div>
          </div>
        )}

        <div className=\"flex justify-end\">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button data-testid=\"add-divida-btn\">
                <Plus className=\"w-4 h-4 mr-2\" />
                Nova Dívida
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Dívida</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className=\"space-y-4 py-4\">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formDivida.descricao}
                    onChange={(e) => setFormDivida({ ...formDivida, descricao: e.target.value })}
                    placeholder=\"Ex: Empréstimo banco, Cheque especial\"
                    required
                  />
                </div>

                <div>
                  <Label>Valor Original (R$)</Label>
                  <Input
                    type=\"number\"
                    min=\"0\"
                    step=\"0.01\"
                    value={formDivida.valorOriginal}
                    onChange={(e) => setFormDivida({ ...formDivida, valorOriginal: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label>Juros Mensal (%)</Label>
                  <Input
                    type=\"number\"
                    min=\"0\"
                    max=\"100\"
                    step=\"0.01\"
                    value={formDivida.jurosMensal}
                    onChange={(e) => setFormDivida({ ...formDivida, jurosMensal: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Data de Início</Label>
                  <Input
                    type=\"date\"
                    value={formDivida.dataInicio}
                    onChange={(e) => setFormDivida({ ...formDivida, dataInicio: e.target.value })}
                    required
                  />
                </div>

                <Button type=\"submit\" className=\"w-full\">
                  Cadastrar Dívida
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {dividas.length === 0 ? (
          <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
            <DollarSign className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
            <h3 className=\"text-xl font-semibold mb-2\">Nenhuma dívida cadastrada</h3>
            <p className=\"text-muted-foreground\">Ótimo! Você não tem dívidas registradas</p>
          </div>
        ) : (
          <div className=\"space-y-4\">
            {dividas.map((divida) => {
              const percentualPago = parseFloat(divida.percentual_pago);
              return (
                <div
                  key={divida.id}
                  className=\"bg-card border border-border/50 rounded-xl p-6 hover:shadow-lg transition-all\"
                  data-testid={`divida-card-${divida.id}`}
                >
                  <div className=\"flex flex-col md:flex-row md:items-center md:justify-between gap-4\">
                    <div className=\"flex-1\">
                      <div className=\"flex items-center gap-3 mb-2\">
                        <h3 className=\"text-xl font-semibold\">{divida.descricao}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(divida.status)}`}>
                          {getStatusLabel(divida.status)}
                        </span>
                      </div>
                      
                      <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4 mt-4\">
                        <div>
                          <p className=\"text-xs text-muted-foreground\">Valor Original</p>
                          <p className=\"font-mono font-medium\">{formatCurrency(divida.valor_original)}</p>
                        </div>
                        <div>
                          <p className=\"text-xs text-muted-foreground\">Valor Atual</p>
                          <p className=\"font-mono font-semibold text-red-500\">{formatCurrency(divida.valor_atual)}</p>
                        </div>
                        <div>
                          <p className=\"text-xs text-muted-foreground\">Juros Mensal</p>
                          <p className=\"font-mono font-medium\">{divida.juros_mensal}%</p>
                        </div>
                        <div>
                          <p className=\"text-xs text-muted-foreground\">Pago</p>
                          <p className=\"font-mono font-medium text-green-500\">{percentualPago.toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className=\"mt-4\">
                        <div className=\"flex justify-between text-xs mb-1\">
                          <span className=\"text-muted-foreground\">Progresso de pagamento</span>
                          <span className=\"font-semibold\">{percentualPago.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={percentualPago} 
                          className=\"h-2\"
                          indicatorClassName=\"bg-green-500\"
                        />
                      </div>
                    </div>

                    <div className=\"flex flex-col gap-2\">
                      {divida.status !== 'quitado' && (
                        <>
                          <Button
                            onClick={() => abrirAmortizacao(divida)}
                            data-testid={`amortizar-btn-${divida.id}`}
                            size=\"sm\"
                          >
                            <DollarSign className=\"w-4 h-4 mr-2\" />
                            Amortizar
                          </Button>
                          
                          <Select
                            value={divida.status}
                            onValueChange={(value) => handleChangeStatus(divida.id, value)}
                          >
                            <SelectTrigger className=\"w-full\">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value=\"pendente\">Pendente</SelectItem>
                              <SelectItem value=\"negociando\">Negociando</SelectItem>
                              <SelectItem value=\"quitado\">Quitado</SelectItem>
                            </SelectContent>
                          </Select>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={openAmortizar} onOpenChange={setOpenAmortizar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Amortizar Dívida</DialogTitle>
              {dividaSelecionada && (
                <p className=\"text-sm text-muted-foreground mt-2\">
                  {dividaSelecionada.descricao} • Saldo: {formatCurrency(dividaSelecionada.valor_atual)}
                </p>
              )}
            </DialogHeader>
            <form onSubmit={handleAmortizar} className=\"space-y-4 py-4\">
              <div>
                <Label>Valor do Pagamento (R$)</Label>
                <Input
                  type=\"number\"
                  min=\"0.01\"
                  max={dividaSelecionada?.valor_atual}
                  step=\"0.01\"
                  value={formAmortizar.valor}
                  onChange={(e) => setFormAmortizar({ ...formAmortizar, valor: e.target.value })}
                  required
                  data-testid=\"valor-amortizar-input\"
                />
              </div>

              <div>
                <Label>Data do Pagamento</Label>
                <Input
                  type=\"date\"
                  value={formAmortizar.dataPagamento}
                  onChange={(e) => setFormAmortizar({ ...formAmortizar, dataPagamento: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Caixinha (de onde sairá o dinheiro)</Label>
                <Select
                  value={formAmortizar.caixinhaId}
                  onValueChange={(value) => setFormAmortizar({ ...formAmortizar, caixinhaId: value })}
                  required
                >
                  <SelectTrigger data-testid=\"caixinha-amortizar-select\">
                    <SelectValue placeholder=\"Selecione uma caixinha\" />
                  </SelectTrigger>
                  <SelectContent>
                    {caixinhas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome_caixinha} ({formatCurrency(c.saldo_disponivel)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Observação (opcional)</Label>
                <Input
                  value={formAmortizar.observacao}
                  onChange={(e) => setFormAmortizar({ ...formAmortizar, observacao: e.target.value })}
                  placeholder=\"Ex: Pagamento parcial, quitação\"
                />
              </div>

              {dividaSelecionada && formAmortizar.valor && (
                <div className=\"bg-secondary/20 border border-border rounded-lg p-4\">
                  <p className=\"text-sm text-muted-foreground mb-2\">Novo saldo após pagamento:</p>
                  <p className=\"text-2xl font-bold font-mono\">
                    {formatCurrency(Math.max(dividaSelecionada.valor_atual - parseFloat(formAmortizar.valor), 0))}
                  </p>
                  {(dividaSelecionada.valor_atual - parseFloat(formAmortizar.valor)) <= 0 && (
                    <p className=\"text-green-500 text-sm mt-2 font-semibold\">🎉 Dívida será quitada!</p>
                  )}
                </div>
              )}

              <Button type=\"submit\" className=\"w-full\" data-testid=\"confirmar-amortizar-btn\">
                Confirmar Pagamento
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
