import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, DollarSign, TrendingDown } from 'lucide-react';
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
        api.get('/api/dividas').catch(() => ({ data: [] })),
        api.get(`/api/caixinhas?mes=${mesAtual}`).catch(() => ({ data: [] })),
        api.get('/api/dividas/estatisticas/resumo').catch(() => ({ data: { total_dividas: 0, pendentes: 0, total_devido: 0 } }))
      ]);
      setDividas(dividasRes.data || []);
      setCaixinhas(caixinhasRes.data || []);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erro ao carregar dividas:', error);
      setDividas([]);
      setCaixinhas([]);
      setStats({ total_dividas: 0, pendentes: 0, total_devido: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/dividas', formDivida);
      toast.success('Dívida cadastrada!');
      setOpenDialog(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar');
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
      toast.success('Amortização registrada!');
      setOpenAmortizar(false);
      setDividaSelecionada(null);
      fetchData();
    } catch (error) {
      toast.error('Erro ao amortizar');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
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
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Gestão de Dívidas</h1>
          <p className="text-muted-foreground mt-2">Acompanhe e quite suas dívidas</p>
        </div>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Devido</p>
              <p className="text-3xl font-bold font-mono text-red-500">
                {formatCurrency(stats.total_devido || 0)}
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Original</p>
              <p className="text-3xl font-bold font-mono">
                {formatCurrency(stats.total_original || 0)}
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Dívidas Quitadas</p>
              <p className="text-3xl font-bold text-green-500">{stats.quitadas || 0}</p>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Dívida
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Dívida</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formDivida.descricao}
                    onChange={(e) => setFormDivida({ ...formDivida, descricao: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Valor Original (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formDivida.valorOriginal}
                    onChange={(e) => setFormDivida({ ...formDivida, valorOriginal: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Juros Mensal (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formDivida.jurosMensal}
                    onChange={(e) => setFormDivida({ ...formDivida, jurosMensal: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full">Cadastrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {dividas.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <DollarSign className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma dívida cadastrada</h3>
          </div>
        ) : (
          <div className="space-y-4">
            {dividas.map((divida) => {
              const percentualPago = parseFloat(divida.percentual_pago);
              return (
                <div key={divida.id} className="bg-card border border-border/50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{divida.descricao}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-500">
                      {divida.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Original</p>
                      <p className="font-mono font-medium">{formatCurrency(divida.valor_original)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Valor Atual</p>
                      <p className="font-mono font-semibold text-red-500">{formatCurrency(divida.valor_atual)}</p>
                    </div>
                  </div>

                  <Progress value={percentualPago} className="h-2 mb-4" indicatorClassName="bg-green-500" />

                  {divida.status !== 'quitado' && (
                    <Button
                      onClick={() => {
                        setDividaSelecionada(divida);
                        setOpenAmortizar(true);
                      }}
                      size="sm"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Amortizar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Dialog open={openAmortizar} onOpenChange={setOpenAmortizar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Amortizar Dívida</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAmortizar} className="space-y-4 py-4">
              <div>
                <Label>Valor do Pagamento (R$)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formAmortizar.valor}
                  onChange={(e) => setFormAmortizar({ ...formAmortizar, valor: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Caixinha (de onde sairá)</Label>
                <Select
                  value={formAmortizar.caixinhaId}
                  onValueChange={(value) => setFormAmortizar({ ...formAmortizar, caixinhaId: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {caixinhas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome_caixinha}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">Confirmar Pagamento</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
