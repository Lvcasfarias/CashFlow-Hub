import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { useBalance } from '../context/BalanceContext';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Target, Calendar, Edit2, Trash2, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Progress } from '../components/ui/progress';

export const MetasPage = () => {
  const { refreshBalance } = useBalance();
  const [metas, setMetas] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [resumo, setResumo] = useState({ ativas: 0, concluidas: 0, total_alvo_ativas: 0, total_poupado_ativas: 0 });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAporte, setOpenAporte] = useState(false);
  const [editingMeta, setEditingMeta] = useState(null);
  const [metaSelecionada, setMetaSelecionada] = useState(null);

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    valorAlvo: '',
    dataLimite: '',
    caixinhaId: '',
    prioridade: '3',
    cor: '#10B981'
  });

  const [formAporte, setFormAporte] = useState({
    valor: '',
    dataAporte: new Date().toISOString().split('T')[0],
    observacao: '',
    caixinhaId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      
      const [metasRes, caixinhasRes, resumoRes] = await Promise.all([
        api.get('/api/metas').catch(() => ({ data: [] })),
        api.get(`/api/caixinhas?mes=${mesAtual}`).catch(() => ({ data: [] })),
        api.get('/api/metas/estatisticas/resumo').catch(() => ({ 
          data: { ativas: 0, concluidas: 0, total_alvo_ativas: 0, total_poupado_ativas: 0 } 
        }))
      ]);
      
      setMetas(Array.isArray(metasRes.data) ? metasRes.data : []);
      setCaixinhas(Array.isArray(caixinhasRes.data) ? caixinhasRes.data : []);
      setResumo(resumoRes.data || { ativas: 0, concluidas: 0, total_alvo_ativas: 0, total_poupado_ativas: 0 });
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
      setMetas([]);
      setCaixinhas([]);
      setResumo({ ativas: 0, concluidas: 0, total_alvo_ativas: 0, total_poupado_ativas: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nome: formData.nome,
        descricao: formData.descricao || null,
        valorAlvo: parseFloat(formData.valorAlvo),
        dataLimite: formData.dataLimite || null,
        caixinhaId: formData.caixinhaId ? parseInt(formData.caixinhaId) : null,
        prioridade: parseInt(formData.prioridade),
        cor: formData.cor
      };

      if (editingMeta) {
        await api.put(`/api/metas/${editingMeta.id}`, payload);
        toast.success('Meta atualizada!');
      } else {
        await api.post('/api/metas', payload);
        toast.success('Meta criada!');
      }
      setOpenDialog(false);
      resetForm();
      fetchData();
      refreshBalance();
    } catch (error) {
      console.error('Erro ao salvar meta:', error);
      toast.error('Erro ao salvar meta');
    }
  };

  const handleAporte = async (e) => {
    e.preventDefault();
    if (!metaSelecionada) return;
    
    try {
      await api.post(`/api/metas/${metaSelecionada.id}/aportar`, {
        valor: parseFloat(formAporte.valor),
        dataAporte: formAporte.dataAporte,
        observacao: formAporte.observacao || null,
        caixinhaId: formAporte.caixinhaId ? parseInt(formAporte.caixinhaId) : null
      });
      toast.success('Aporte realizado!');
      setOpenAporte(false);
      setMetaSelecionada(null);
      setFormAporte({
        valor: '',
        dataAporte: new Date().toISOString().split('T')[0],
        observacao: '',
        caixinhaId: ''
      });
      fetchData();
      refreshBalance();
    } catch (error) {
      console.error('Erro ao fazer aporte:', error);
      toast.error('Erro ao fazer aporte');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta meta?')) return;
    try {
      await api.delete(`/api/metas/${id}`);
      toast.success('Meta excluida!');
      fetchData();
      refreshBalance();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir');
    }
  };

  const handleEdit = (meta) => {
    setEditingMeta(meta);
    setFormData({
      nome: meta.nome || '',
      descricao: meta.descricao || '',
      valorAlvo: meta.valor_alvo || '',
      dataLimite: meta.data_limite ? meta.data_limite.split('T')[0] : '',
      caixinhaId: meta.caixinha_id ? String(meta.caixinha_id) : '',
      prioridade: meta.prioridade ? String(meta.prioridade) : '3',
      cor: meta.cor || '#10B981'
    });
    setOpenDialog(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      valorAlvo: '',
      dataLimite: '',
      caixinhaId: '',
      prioridade: '3',
      cor: '#10B981'
    });
    setEditingMeta(null);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0);
  };

  const getPrioridadeLabel = (p) => {
    const labels = { 1: 'Muito Baixa', 2: 'Baixa', 3: 'Media', 4: 'Alta', 5: 'Muito Alta' };
    return labels[p] || 'Media';
  };

  const getPrioridadeColor = (p) => {
    const colors = { 1: 'text-gray-500', 2: 'text-blue-500', 3: 'text-yellow-500', 4: 'text-orange-500', 5: 'text-red-500' };
    return colors[p] || 'text-yellow-500';
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
      <div className="space-y-8" data-testid="metas-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Metas</h1>
            <p className="text-muted-foreground mt-2">Defina e acompanhe seus objetivos financeiros</p>
          </div>
          <Dialog open={openDialog} onOpenChange={(open) => { setOpenDialog(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-meta-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMeta ? 'Editar Meta' : 'Nova Meta'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <Label>Nome da Meta</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Viagem para Europa"
                    required
                    data-testid="meta-nome-input"
                  />
                </div>
                <div>
                  <Label>Descricao (opcional)</Label>
                  <Input
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Detalhes sobre a meta"
                  />
                </div>
                <div>
                  <Label>Valor Alvo (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valorAlvo}
                    onChange={(e) => setFormData({ ...formData, valorAlvo: e.target.value })}
                    required
                    data-testid="meta-valor-input"
                  />
                </div>
                <div>
                  <Label>Data Limite (opcional)</Label>
                  <Input
                    type="date"
                    value={formData.dataLimite}
                    onChange={(e) => setFormData({ ...formData, dataLimite: e.target.value })}
                    data-testid="meta-data-input"
                  />
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
                          {c.nome_caixinha}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.prioridade}
                    onValueChange={(value) => setFormData({ ...formData, prioridade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Muito Baixa</SelectItem>
                      <SelectItem value="2">Baixa</SelectItem>
                      <SelectItem value="3">Media</SelectItem>
                      <SelectItem value="4">Alta</SelectItem>
                      <SelectItem value="5">Muito Alta</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Button type="submit" className="w-full" data-testid="submit-meta-btn">
                  {editingMeta ? 'Salvar' : 'Criar Meta'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {resumo && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Metas Ativas</p>
              <p className="text-3xl font-bold">{resumo.ativas || 0}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Metas Concluidas</p>
              <p className="text-3xl font-bold text-green-500">{resumo.concluidas || 0}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Total a Alcancar</p>
              <p className="text-2xl font-bold font-mono">{formatCurrency(resumo.total_alvo_ativas)}</p>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-2">Total Poupado</p>
              <p className="text-2xl font-bold font-mono text-green-500">
                {formatCurrency(resumo.total_poupado_ativas)}
              </p>
            </div>
          </div>
        )}

        {!metas || metas.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
            <Target className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma meta cadastrada</h3>
            <p className="text-muted-foreground mb-6">
              Crie metas financeiras para alcancar seus sonhos
            </p>
            <Button onClick={() => setOpenDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Meta
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {metas.map((meta) => {
              const valorAlvo = parseFloat(meta.valor_alvo) || 0;
              const valorAtual = parseFloat(meta.valor_atual) || 0;
              const percentual = valorAlvo > 0 ? (valorAtual / valorAlvo * 100) : 0;
              const isCompleted = meta.status === 'concluida';

              return (
                <div
                  key={meta.id}
                  className={`bg-card border rounded-xl overflow-hidden transition-all ${
                    isCompleted ? 'border-green-500/50' : 'border-border/50'
                  }`}
                  data-testid={`meta-card-${meta.id}`}
                >
                  <div className="h-2" style={{ backgroundColor: meta.cor || '#10B981' }} />
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{meta.nome}</h3>
                        {meta.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{meta.descricao}</p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(meta.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-semibold">{percentual.toFixed(1)}%</span>
                      </div>
                      <Progress
                        value={Math.min(percentual, 100)}
                        className="h-3"
                        indicatorClassName={isCompleted ? 'bg-green-500' : ''}
                      />
                      <div className="flex justify-between text-sm font-mono">
                        <span className="text-green-500">{formatCurrency(valorAtual)}</span>
                        <span className="text-muted-foreground">{formatCurrency(valorAlvo)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className={`px-2 py-1 rounded-full bg-secondary ${getPrioridadeColor(meta.prioridade)}`}>
                        {getPrioridadeLabel(meta.prioridade)}
                      </span>
                      {meta.data_limite && (
                        <span className="px-2 py-1 rounded-full bg-secondary flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(meta.data_limite).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>

                    {meta.valor_mensal_necessario && parseFloat(meta.valor_mensal_necessario) > 0 && !isCompleted && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Aporte mensal sugerido:</p>
                        <p className="font-mono font-semibold text-primary">
                          {formatCurrency(meta.valor_mensal_necessario)}
                        </p>
                      </div>
                    )}

                    {!isCompleted && (
                      <Button
                        className="w-full"
                        onClick={() => {
                          setMetaSelecionada(meta);
                          setOpenAporte(true);
                        }}
                        data-testid={`aportar-meta-${meta.id}`}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Fazer Aporte
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="bg-green-500/20 text-green-500 rounded-lg p-3 text-center font-semibold">
                        Meta Concluida!
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Dialog de Aporte */}
        <Dialog open={openAporte} onOpenChange={setOpenAporte}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fazer Aporte - {metaSelecionada?.nome}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAporte} className="space-y-4 py-4">
              <div>
                <Label>Valor do Aporte (R$)</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formAporte.valor}
                  onChange={(e) => setFormAporte({ ...formAporte, valor: e.target.value })}
                  required
                  data-testid="aporte-valor-input"
                />
              </div>
              <div>
                <Label>Data do Aporte</Label>
                <Input
                  type="date"
                  value={formAporte.dataAporte}
                  onChange={(e) => setFormAporte({ ...formAporte, dataAporte: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Debitar de Caixinha (opcional)</Label>
                <Select
                  value={formAporte.caixinhaId}
                  onValueChange={(value) => setFormAporte({ ...formAporte, caixinhaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
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
                <Label>Observacao (opcional)</Label>
                <Input
                  value={formAporte.observacao}
                  onChange={(e) => setFormAporte({ ...formAporte, observacao: e.target.value })}
                  placeholder="Ex: Bonus do trabalho"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="confirm-aporte-btn">
                Confirmar Aporte
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
