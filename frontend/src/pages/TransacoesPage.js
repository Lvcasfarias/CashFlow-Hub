import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Filter } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const TransacoesPage = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'saida',
    valor: '',
    descricao: '',
    caixinhaId: '',
    data: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const ultimoDia = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const [transacoesRes, caixinhasRes] = await Promise.all([
        api.get(`/api/transacoes?dataInicio=${mesAtual}-01&dataFim=${mesAtual}-${ultimoDia}`),
        api.get(`/api/caixinhas?mes=${mesAtual}`)
      ]);
      setTransacoes(transacoesRes.data);
      setCaixinhas(caixinhasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (formData.tipo === 'saida' && !formData.caixinhaId) {
      toast.error('Selecione uma caixinha para saídas');
      return;
    }

    try {
      await api.post('/api/transacoes', {
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        caixinhaId: formData.caixinhaId ? parseInt(formData.caixinhaId) : null,
        data: formData.data,
      });
      
      toast.success('Transação cadastrada com sucesso!');
      setOpenDialog(false);
      setFormData({
        tipo: 'saida',
        valor: '',
        descricao: '',
        caixinhaId: '',
        data: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar transação');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;

    try {
      await api.delete(`/api/transacoes/${id}`);
      toast.success('Transação excluída com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir transação');
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
      <div className="space-y-8" data-testid="transacoes-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Transações</h1>
            <p className="text-muted-foreground mt-2">Gerencie suas entradas e saídas</p>
          </div>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button data-testid="add-transacao-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Transação
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nova Transação</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger data-testid="tipo-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    data-testid="valor-input"
                    required
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Compras no mercado"
                    data-testid="descricao-input"
                  />
                </div>

                {formData.tipo === 'saida' && (
                  <div>
                    <Label>Caixinha *</Label>
                    <Select
                      value={formData.caixinhaId}
                      onValueChange={(value) => setFormData({ ...formData, caixinhaId: value })}
                    >
                      <SelectTrigger data-testid="caixinha-select">
                        <SelectValue placeholder="Selecione uma caixinha" />
                      </SelectTrigger>
                      <SelectContent>
                        {caixinhas.map((caixinha) => (
                          <SelectItem key={caixinha.id} value={String(caixinha.id)}>
                            {caixinha.nome_caixinha}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    data-testid="data-input"
                    required
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-transacao-btn">
                  Cadastrar Transação
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {transacoes.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <Plus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma transação cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Comece cadastrando suas entradas e saídas
            </p>
            <Button onClick={() => setOpenDialog(true)} data-testid="empty-add-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transacoes-table">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Data</th>
                    <th className="text-left p-4 font-semibold">Descrição</th>
                    <th className="text-left p-4 font-semibold">Caixinha</th>
                    <th className="text-left p-4 font-semibold">Tipo</th>
                    <th className="text-right p-4 font-semibold">Valor</th>
                    <th className="text-center p-4 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map((transacao) => (
                    <tr
                      key={transacao.id}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                      data-testid={`transacao-row-${transacao.id}`}
                    >
                      <td className="p-4 font-mono text-sm">{formatDate(transacao.data)}</td>
                      <td className="p-4">{transacao.descricao || 'Sem descrição'}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {transacao.nome_caixinha || '-'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transacao.tipo === 'entrada'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td
                        className={`p-4 text-right font-mono font-semibold ${
                          transacao.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        {transacao.tipo === 'entrada' ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </td>
                      <td className="p-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(transacao.id)}
                          data-testid={`delete-transacao-${transacao.id}`}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
