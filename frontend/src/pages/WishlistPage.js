import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Heart, ShoppingBag, Calendar, Edit2, Trash2, Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';

export const WishlistPage = () => {
  const [items, setItems] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openComprar, setOpenComprar] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('');

  const [formData, setFormData] = useState({
    item: '',
    valorEstimado: '',
    necessidade: '3',
    desejo: '3',
    caixinhaId: '',
    aporteMensal: ''
  });

  const [formComprar, setFormComprar] = useState({
    caixinhaId: '',
    valorReal: ''
  });

  useEffect(() => {
    fetchData();
  }, [filtroStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const statusQuery = filtroStatus ? `?status=${filtroStatus}` : '';
      const [itemsRes, caixinhasRes] = await Promise.all([
        api.get(`/api/wishlist${statusQuery}`),
        api.get(`/api/caixinhas?mes=${mesAtual}`)
      ]);
      setItems(itemsRes.data);
      setCaixinhas(caixinhasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        caixinhaId: formData.caixinhaId ? parseInt(formData.caixinhaId) : null,
        aporteMensal: formData.aporteMensal ? parseFloat(formData.aporteMensal) : 0
      };

      if (editingItem) {
        await api.put(`/api/wishlist/${editingItem.id}`, data);
        toast.success('Item atualizado!');
      } else {
        await api.post('/api/wishlist', data);
        toast.success('Item adicionado a wishlist!');
      }
      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar item');
    }
  };

  const handleComprar = async (e) => {
    e.preventDefault();
    if (!itemSelecionado) return;
    try {
      await api.post(`/api/wishlist/${itemSelecionado.id}/comprar`, {
        caixinhaId: formComprar.caixinhaId ? parseInt(formComprar.caixinhaId) : null,
        valorReal: formComprar.valorReal ? parseFloat(formComprar.valorReal) : null
      });
      toast.success('Item marcado como comprado!');
      setOpenComprar(false);
      setItemSelecionado(null);
      setFormComprar({ caixinhaId: '', valorReal: '' });
      fetchData();
    } catch (error) {
      toast.error('Erro ao marcar como comprado');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remover este item da wishlist?')) return;
    try {
      await api.delete(`/api/wishlist/${id}`);
      toast.success('Item removido!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao remover');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      item: item.item,
      valorEstimado: item.valor_estimado,
      necessidade: String(item.necessidade),
      desejo: String(item.desejo),
      caixinhaId: item.caixinha_id ? String(item.caixinha_id) : '',
      aporteMensal: item.aporte_mensal || ''
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      item: '',
      valorEstimado: '',
      necessidade: '3',
      desejo: '3',
      caixinhaId: '',
      aporteMensal: ''
    });
    setEditingItem(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      desejando: 'bg-blue-500/20 text-blue-500',
      poupando: 'bg-yellow-500/20 text-yellow-500',
      comprado: 'bg-green-500/20 text-green-500',
      cancelado: 'bg-gray-500/20 text-gray-500'
    };
    return colors[status] || colors.desejando;
  };

  const getStatusLabel = (status) => {
    const labels = {
      desejando: 'Desejando',
      poupando: 'Poupando',
      comprado: 'Comprado',
      cancelado: 'Cancelado'
    };
    return labels[status] || 'Desejando';
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
      <div className="space-y-8" data-testid="wishlist-page">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Wishlist</h1>
            <p className="text-muted-foreground mt-2">Lista de desejos e compras planejadas</p>
          </div>
          <div className="flex gap-2">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="desejando">Desejando</SelectItem>
                <SelectItem value="poupando">Poupando</SelectItem>
                <SelectItem value="comprado">Comprado</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="add-wishlist-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Desejo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                  <div>
                    <Label>O que voce deseja?</Label>
                    <Input
                      value={formData.item}
                      onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                      placeholder="Ex: iPhone 15 Pro"
                      required
                      data-testid="wishlist-item-input"
                    />
                  </div>
                  <div>
                    <Label>Valor Estimado (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.valorEstimado}
                      onChange={(e) => setFormData({ ...formData, valorEstimado: e.target.value })}
                      required
                      data-testid="wishlist-valor-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Necessidade (1-5)</Label>
                      <Select
                        value={formData.necessidade}
                        onValueChange={(value) => setFormData({ ...formData, necessidade: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Dispensavel</SelectItem>
                          <SelectItem value="2">2 - Pouco Necessario</SelectItem>
                          <SelectItem value="3">3 - Moderado</SelectItem>
                          <SelectItem value="4">4 - Necessario</SelectItem>
                          <SelectItem value="5">5 - Essencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Desejo (1-5)</Label>
                      <Select
                        value={formData.desejo}
                        onValueChange={(value) => setFormData({ ...formData, desejo: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Baixo</SelectItem>
                          <SelectItem value="2">2 - Moderado</SelectItem>
                          <SelectItem value="3">3 - Medio</SelectItem>
                          <SelectItem value="4">4 - Alto</SelectItem>
                          <SelectItem value="5">5 - Muito Alto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Vincular a Caixinha (opcional)</Label>
                    <Select
                      value={formData.caixinhaId}
                      onValueChange={(value) => setFormData({ ...formData, caixinhaId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma caixinha" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Nenhuma</SelectItem>
                        {caixinhas.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.nome_caixinha} ({formatCurrency(c.saldo_disponivel)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Aporte Mensal Planejado (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.aporteMensal}
                      onChange={(e) => setFormData({ ...formData, aporteMensal: e.target.value })}
                      placeholder="Quanto pretende guardar por mes"
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="submit-wishlist-btn">
                    {editingItem ? 'Salvar Alteracoes' : 'Adicionar a Wishlist'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sua wishlist esta vazia</h3>
            <p className="text-muted-foreground mb-6">
              Adicione itens que voce deseja comprar
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Desejo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
              const prioridadeScore = item.prioridade_score;
              const isComprado = item.status === 'comprado';

              return (
                <div
                  key={item.id}
                  className={`bg-card border rounded-xl p-6 transition-all ${
                    isComprado ? 'opacity-75 border-green-500/50' : 'border-border/50'
                  }`}
                  data-testid={`wishlist-card-${item.id}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.item}</h3>
                      <p className="text-2xl font-bold font-mono mt-1">
                        {formatCurrency(item.valor_estimado)}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!isComprado && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {getStatusLabel(item.status)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Prioridade: {prioridadeScore}/10
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Necessidade</span>
                        <span>{item.necessidade}/5</span>
                      </div>
                      <Progress value={(item.necessidade / 5) * 100} className="h-1" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Desejo</span>
                        <span>{item.desejo}/5</span>
                      </div>
                      <Progress value={(item.desejo / 5) * 100} className="h-1" indicatorClassName="bg-pink-500" />
                    </div>

                    {item.nome_caixinha && (
                      <div className="text-sm text-muted-foreground">
                        Caixinha: <span className="text-foreground">{item.nome_caixinha}</span>
                      </div>
                    )}

                    {item.meses_para_comprar && !isComprado && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            Estimativa: <strong>{item.meses_para_comprar} meses</strong>
                          </span>
                        </div>
                        {item.data_estimada_compra && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Previsao: {new Date(item.data_estimada_compra).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    )}

                    {!isComprado && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setItemSelecionado(item);
                          setFormComprar({ caixinhaId: '', valorReal: item.valor_estimado });
                          setOpenComprar(true);
                        }}
                        data-testid={`comprar-${item.id}`}
                      >
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Marcar como Comprado
                      </Button>
                    )}

                    {isComprado && (
                      <div className="bg-green-500/20 text-green-500 rounded-lg p-3 text-center font-semibold flex items-center justify-center gap-2">
                        <Check className="w-4 h-4" />
                        Comprado!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dialog de Comprar */}
        <Dialog open={openComprar} onOpenChange={setOpenComprar}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar como Comprado - {itemSelecionado?.item}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleComprar} className="space-y-4 py-4">
              <div>
                <Label>Valor Real da Compra (R$)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formComprar.valorReal}
                  onChange={(e) => setFormComprar({ ...formComprar, valorReal: e.target.value })}
                  placeholder="Deixe em branco para usar valor estimado"
                />
              </div>
              <div>
                <Label>Debitar de Caixinha (opcional)</Label>
                <Select
                  value={formComprar.caixinhaId}
                  onValueChange={(value) => setFormComprar({ ...formComprar, caixinhaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nao debitar</SelectItem>
                    {caixinhas.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.nome_caixinha} ({formatCurrency(c.saldo_disponivel)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" data-testid="confirm-comprar-btn">
                Confirmar Compra
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
