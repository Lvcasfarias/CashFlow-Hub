import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Filter, Edit2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export const TransacoesPage = () => {
  const [transacoes, setTransacoes] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState(null);
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    tipo: ''
  });
  const [formData, setFormData] = useState({
    tipo: 'saida',
    valor: '',
    descricao: '',
    caixinhaId: '',
    categoriaId: '',
    metodoPagamento: 'pix',
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
      const dataInicio = filtros.dataInicio || `${mesAtual}-01`;
      const dataFim = filtros.dataFim || `${mesAtual}-${ultimoDia}`;
      
      let url = `/api/transacoes?dataInicio=${dataInicio}&dataFim=${dataFim}`;
      if (filtros.tipo) url += `&tipo=${filtros.tipo}`;
      
      const [transacoesRes, caixinhasRes, categoriasRes] = await Promise.all([
        api.get(url),
        api.get(`/api/caixinhas?mes=${mesAtual}`),
        api.get('/api/categorias')
      ]);
      setTransacoes(transacoesRes.data || []);
      setCaixinhas(caixinhasRes.data || []);
      setCategorias(categoriasRes.data || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      toast.error('Digite um valor valido');
      return;
    }

    if (formData.tipo === 'saida' && !formData.caixinhaId) {
      toast.error('Selecione uma caixinha para saidas');
      return;
    }

    try {
      const payload = {
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao,
        caixinhaId: formData.caixinhaId ? parseInt(formData.caixinhaId) : null,
        categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null,
        metodoPagamento: formData.metodoPagamento,
        data: formData.data,
      };

      if (editingTransacao) {
        await api.put(`/api/transacoes/${editingTransacao.id}`, payload);
        toast.success('Transacao atualizada!');
      } else {
        await api.post('/api/transacoes', payload);
        toast.success('Transacao cadastrada!');
      }
      
      setOpenDialog(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error('Erro ao salvar transacao');
    }
  };

  const handleEdit = (transacao) => {
    setEditingTransacao(transacao);
    setFormData({
      tipo: transacao.tipo,
      valor: transacao.valor,
      descricao: transacao.descricao || '',
      caixinhaId: transacao.caixinha_id ? String(transacao.caixinha_id) : '',
      categoriaId: transacao.categoria_id ? String(transacao.categoria_id) : '',
      metodoPagamento: transacao.metodo_pagamento || 'pix',
      data: transacao.data ? transacao.data.split('T')[0] : new Date().toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta transacao?')) return;

    try {
      await api.delete(`/api/transacoes/${id}`);
      toast.success('Transacao excluida!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir transacao');
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: 'saida',
      valor: '',
      descricao: '',
      caixinhaId: '',
      categoriaId: '',
      metodoPagamento: 'pix',
      data: new Date().toISOString().split('T')[0],
    });
    setEditingTransacao(null);
  };

  const exportToCSV = () => {
    if (transacoes.length === 0) {
      toast.error('Nenhuma transacao para exportar');
      return;
    }
    const headers = ['Data', 'Tipo', 'Descricao', 'Categoria', 'Caixinha', 'Metodo', 'Valor'];
    const csvContent = [
      headers.join(','),
      ...transacoes.map(t => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.tipo,
        `"${t.descricao || ''}"`,
        t.categoria_nome || '',
        t.nome_caixinha || '',
        t.metodo_pagamento || '',
        t.valor
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Exportado!');
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

  const getMetodoPagamentoLabel = (metodo) => {
    const labels = {
      dinheiro: 'Dinheiro',
      pix: 'PIX',
      cartao_debito: 'Cartao Debito',
      cartao_credito: 'Cartao Credito',
      transferencia: 'Transferencia',
      boleto: 'Boleto'
    };
    return labels[metodo] || metodo;
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
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Transacoes</h1>
            <p className="text-muted-foreground mt-2">Gerencie suas entradas e saidas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCSV} data-testid="export-csv-btn">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button data-testid="add-transacao-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transacao
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingTransacao ? 'Editar Transacao' : 'Nova Transacao'}</DialogTitle>
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
                        <SelectItem value="saida">Saida</SelectItem>
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
                    <Label>Descricao</Label>
                    <Input
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Ex: Compras no mercado"
                      data-testid="descricao-input"
                    />
                  </div>

                  <div>
                    <Label>Categoria</Label>
                    <Select
                      value={formData.categoriaId}
                      onValueChange={(value) => setFormData({ ...formData, categoriaId: value })}
                    >
                      <SelectTrigger data-testid="categoria-select">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.filter(c => c.tipo === formData.tipo).map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Metodo de Pagamento</Label>
                    <Select
                      value={formData.metodoPagamento}
                      onValueChange={(value) => setFormData({ ...formData, metodoPagamento: value })}
                    >
                      <SelectTrigger data-testid="metodo-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="pix">PIX</SelectItem>
                        <SelectItem value="cartao_debito">Cartao Debito</SelectItem>
                        <SelectItem value="cartao_credito">Cartao Credito</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="boleto">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
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
                    {editingTransacao ? 'Salvar Alteracoes' : 'Cadastrar Transacao'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-card border border-border/50 rounded-xl p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs">Data Inicio</Label>
              <Input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs">Data Fim</Label>
              <Input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                className="w-40"
              />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <Select value={filtros.tipo} onValueChange={(value) => setFiltros({ ...filtros, tipo: value })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" onClick={fetchData}>
              <Filter className="w-4 h-4 mr-2" />
              Filtrar
            </Button>
          </div>
        </div>

        {transacoes.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <Plus className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma transacao encontrada</h3>
            <p className="text-muted-foreground mb-6">
              Comece cadastrando suas entradas e saidas
            </p>
            <Button onClick={() => setOpenDialog(true)} data-testid="empty-add-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transacao
            </Button>
          </div>
        ) : (
          <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="transacoes-table">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-semibold">Data</th>
                    <th className="text-left p-4 font-semibold">Descricao</th>
                    <th className="text-left p-4 font-semibold">Categoria</th>
                    <th className="text-left p-4 font-semibold">Caixinha</th>
                    <th className="text-left p-4 font-semibold">Metodo</th>
                    <th className="text-left p-4 font-semibold">Tipo</th>
                    <th className="text-right p-4 font-semibold">Valor</th>
                    <th className="text-center p-4 font-semibold">Acoes</th>
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
                      <td className="p-4">{transacao.descricao || 'Sem descricao'}</td>
                      <td className="p-4 text-sm">
                        {transacao.categoria_nome && (
                          <span 
                            className="px-2 py-1 rounded-full text-xs"
                            style={{ backgroundColor: `${transacao.categoria_cor}20`, color: transacao.categoria_cor }}
                          >
                            {transacao.categoria_nome}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {transacao.nome_caixinha || '-'}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {getMetodoPagamentoLabel(transacao.metodo_pagamento)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            transacao.tipo === 'entrada'
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}
                        >
                          {transacao.tipo === 'entrada' ? 'Entrada' : 'Saida'}
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
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(transacao)}
                            data-testid={`edit-transacao-${transacao.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transacao.id)}
                            data-testid={`delete-transacao-${transacao.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
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
