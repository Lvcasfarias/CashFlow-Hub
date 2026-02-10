import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, CreditCard, Calendar, AlertCircle, Check, Edit2, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Progress } from '../components/ui/progress';

export const CartoesPage = () => {
  const [cartoes, setCartoes] = useState([]);
  const [resumo, setResumo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCartao, setEditingCartao] = useState(null);
  const [faturaAtual, setFaturaAtual] = useState(null);
  const [openFatura, setOpenFatura] = useState(false);
  const [cartaoSelecionado, setCartaoSelecionado] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    bandeira: '',
    limite: '',
    diaFechamento: '',
    diaVencimento: '',
    cor: '#8B5CF6'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [cartoesRes, resumoRes] = await Promise.all([
        api.get('/api/cartoes'),
        api.get('/api/cartoes/resumo')
      ]);
      setCartoes(cartoesRes.data);
      setResumo(resumoRes.data);
    } catch (error) {
      toast.error('Erro ao carregar cartoes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCartao) {
        await api.put(`/api/cartoes/${editingCartao.id}`, formData);
        toast.success('Cartao atualizado!');
      } else {
        await api.post('/api/cartoes', formData);
        toast.success('Cartao cadastrado!');
      }
      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar cartao');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir este cartao?')) return;
    try {
      await api.delete(`/api/cartoes/${id}`);
      toast.success('Cartao excluido!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (cartao) => {
    setEditingCartao(cartao);
    setFormData({
      nome: cartao.nome,
      bandeira: cartao.bandeira || '',
      limite: cartao.limite,
      diaFechamento: cartao.dia_fechamento,
      diaVencimento: cartao.dia_vencimento,
      cor: cartao.cor || '#8B5CF6'
    });
    setOpenDialog(true);
  };

  const handleVerFatura = async (cartao) => {
    try {
      const response = await api.get(`/api/cartoes/${cartao.id}/fatura-atual`);
      setFaturaAtual(response.data);
      setCartaoSelecionado(cartao);
      setOpenFatura(true);
    } catch (error) {
      toast.error('Erro ao carregar fatura');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      bandeira: '',
      limite: '',
      diaFechamento: '',
      diaVencimento: '',
      cor: '#8B5CF6'
    });
    setEditingCartao(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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
      <div className="space-y-8" data-testid="cartoes-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Cartoes de Credito</h1>
            <p className="text-muted-foreground mt-2">Gerencie seus cartoes e faturas</p>
          </div>
          <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-cartao-btn">
                <Plus className="w-4 h-4 mr-2" />
                Novo Cartao
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCartao ? 'Editar Cartao' : 'Novo Cartao'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <Label>Nome do Cartao</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Nubank"
                    required
                    data-testid="cartao-nome-input"
                  />
                </div>
                <div>
                  <Label>Bandeira</Label>
                  <Input
                    value={formData.bandeira}
                    onChange={(e) => setFormData({ ...formData, bandeira: e.target.value })}
                    placeholder="Ex: Mastercard"
                    data-testid="cartao-bandeira-input"
                  />
                </div>
                <div>
                  <Label>Limite (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.limite}
                    onChange={(e) => setFormData({ ...formData, limite: e.target.value })}
                    required
                    data-testid="cartao-limite-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dia de Fechamento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.diaFechamento}
                      onChange={(e) => setFormData({ ...formData, diaFechamento: e.target.value })}
                      required
                      data-testid="cartao-fechamento-input"
                    />
                  </div>
                  <div>
                    <Label>Dia de Vencimento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.diaVencimento}
                      onChange={(e) => setFormData({ ...formData, diaVencimento: e.target.value })}
                      required
                      data-testid="cartao-vencimento-input"
                    />
                  </div>
                </div>
                <div>
                  <Label>Cor</Label>
                  <Input
                    type="color"
                    value={formData.cor}
                    onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                    className="h-10 w-full"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-cartao-btn">
                  {editingCartao ? 'Salvar Alteracoes' : 'Cadastrar Cartao'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Limite Total</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(resumo.limite_total)}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Limite Disponivel</p>
              <p className="text-2xl font-bold font-mono text-green-500">
                {formatCurrency(resumo.limite_disponivel_total)}
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Utilizado</p>
              <p className="text-2xl font-bold font-mono text-orange-500">
                {formatCurrency(resumo.total_utilizado)}
              </p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Faturas Abertas</p>
              <p className="text-2xl font-bold font-mono text-red-500">
                {formatCurrency(resumo.total_faturas_abertas)}
              </p>
            </div>
          </div>
        )}

        {cartoes.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum cartao cadastrado</h3>
            <p className="text-muted-foreground mb-6">
              Cadastre seus cartoes de credito para acompanhar as faturas
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Cartao
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cartoes.map((cartao) => {
              const percentualUsado = cartao.limite > 0
                ? ((cartao.limite - cartao.limite_disponivel) / cartao.limite) * 100
                : 0;

              return (
                <div
                  key={cartao.id}
                  className="bg-card border border-border/50 rounded-xl overflow-hidden"
                  data-testid={`cartao-card-${cartao.id}`}
                >
                  <div
                    className="h-2"
                    style={{ backgroundColor: cartao.cor || '#8B5CF6' }}
                  />
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-8 h-8" style={{ color: cartao.cor }} />
                        <div>
                          <h3 className="font-semibold text-lg">{cartao.nome}</h3>
                          {cartao.bandeira && (
                            <p className="text-sm text-muted-foreground">{cartao.bandeira}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(cartao)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(cartao.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Disponivel</span>
                        <span className="font-mono font-semibold text-green-500">
                          {formatCurrency(cartao.limite_disponivel)}
                        </span>
                      </div>
                      <Progress
                        value={percentualUsado}
                        className="h-2"
                        indicatorClassName={percentualUsado > 80 ? 'bg-red-500' : 'bg-primary'}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Utilizado: {formatCurrency(cartao.limite - cartao.limite_disponivel)}</span>
                        <span>Limite: {formatCurrency(cartao.limite)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Fecha: dia {cartao.dia_fechamento}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Vence: dia {cartao.dia_vencimento}</span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleVerFatura(cartao)}
                      data-testid={`ver-fatura-${cartao.id}`}
                    >
                      Ver Fatura Atual
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dialog da Fatura */}
        <Dialog open={openFatura} onOpenChange={setOpenFatura}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Fatura {cartaoSelecionado?.nome} - {faturaAtual?.fatura?.mes_referencia}
              </DialogTitle>
            </DialogHeader>
            {faturaAtual && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(faturaAtual.fatura.valor_total)}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-lg font-semibold ${
                      faturaAtual.fatura.status === 'paga' ? 'text-green-500' :
                      faturaAtual.fatura.status === 'fechada' ? 'text-orange-500' : 'text-blue-500'
                    }`}>
                      {faturaAtual.fatura.status === 'paga' ? 'Paga' :
                       faturaAtual.fatura.status === 'fechada' ? 'Fechada' : 'Aberta'}
                    </p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4 text-center">
                    <p className="text-sm text-muted-foreground">Transacoes</p>
                    <p className="text-2xl font-bold">{faturaAtual.transacoes?.length || 0}</p>
                  </div>
                </div>

                {faturaAtual.transacoes && faturaAtual.transacoes.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/50">
                        <tr>
                          <th className="text-left p-3">Data</th>
                          <th className="text-left p-3">Descricao</th>
                          <th className="text-right p-3">Valor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {faturaAtual.transacoes.map((t) => (
                          <tr key={t.id} className="border-t border-border/50">
                            <td className="p-3 font-mono text-xs">
                              {new Date(t.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="p-3">{t.descricao || 'Sem descricao'}</td>
                            <td className="p-3 text-right font-mono text-red-500">
                              {formatCurrency(t.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>Nenhuma transacao nesta fatura</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
