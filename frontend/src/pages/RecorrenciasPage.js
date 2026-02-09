import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, CreditCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

export const RecorrenciasPage = () => {
  const [recorrencias, setRecorrencias] = useState([]);
  const [parceladas, setParceladas] = useState([]);
  const [caixinhas, setCaixinhas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialogFixa, setOpenDialogFixa] = useState(false);
  const [openDialogParcelada, setOpenDialogParcelada] = useState(false);

  const [formFixa, setFormFixa] = useState({
    tipo: 'saida',
    valor: '',
    descricao: '',
    diaVencimento: 1,
    frequencia: 'mensal',
    caixinhaId: ''
  });

  const [formParcelada, setFormParcelada] = useState({
    descricao: '',
    valorTotal: '',
    numParcelas: '',
    diaVencimento: 1,
    dataInicio: new Date().toISOString().split('T')[0],
    caixinhaId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const [recorrenciasRes, parceladasRes, caixinhasRes] = await Promise.all([
        api.get('/api/recorrencias'),
        api.get('/api/recorrencias/parceladas'),
        api.get(`/api/caixinhas?mes=${mesAtual}`)
      ]);
      setRecorrencias(recorrenciasRes.data);
      setParceladas(parceladasRes.data);
      setCaixinhas(caixinhasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFixa = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/recorrencias', formFixa);
      toast.success('Conta fixa cadastrada!');
      setOpenDialogFixa(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar');
    }
  };

  const handleSubmitParcelada = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/recorrencias/parceladas', formParcelada);
      toast.success('Compra parcelada cadastrada!');
      setOpenDialogParcelada(false);
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar');
    }
  };

  const handleDelete = async (id, tipo) => {
    if (!window.confirm('Deseja excluir?')) return;
    try {
      if (tipo === 'fixa') {
        await api.delete(`/api/recorrencias/${id}`);
      } else {
        await api.delete(`/api/recorrencias/parceladas/${id}`);
      }
      toast.success('Excluído!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir');
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
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Recorrências</h1>
          <p className="text-muted-foreground mt-2">Gerencie suas contas fixas e compras parceladas</p>
        </div>

        <Tabs defaultValue="fixas" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="fixas">Contas Fixas</TabsTrigger>
            <TabsTrigger value="parceladas">Parceladas</TabsTrigger>
          </TabsList>

          <TabsContent value="fixas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openDialogFixa} onOpenChange={setOpenDialogFixa}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Conta Fixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conta Fixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitFixa} className="space-y-4 py-4">
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={formFixa.descricao}
                        onChange={(e) => setFormFixa({ ...formFixa, descricao: e.target.value })}
                        placeholder="Ex: Aluguel"
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formFixa.valor}
                        onChange={(e) => setFormFixa({ ...formFixa, valor: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Dia do Vencimento</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={formFixa.diaVencimento}
                        onChange={(e) => setFormFixa({ ...formFixa, diaVencimento: e.target.value })}
                        required
                      />
                    </div>
                    {formFixa.tipo === 'saida' && (
                      <div>
                        <Label>Caixinha</Label>
                        <Select
                          value={formFixa.caixinhaId}
                          onValueChange={(value) => setFormFixa({ ...formFixa, caixinhaId: value })}
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
                    )}
                    <Button type="submit" className="w-full">Cadastrar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {recorrencias.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma conta fixa</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recorrencias.map((rec) => (
                  <div key={rec.id} className="bg-card border rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-2">{rec.descricao}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Dia {rec.dia_vencimento}
                    </p>
                    <p className="font-mono font-semibold text-red-500 text-xl">
                      {formatCurrency(rec.valor)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(rec.id, 'fixa')}
                      className="w-full mt-4 text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="parceladas" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={openDialogParcelada} onOpenChange={setOpenDialogParcelada}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Parcelada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Compra Parcelada</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitParcelada} className="space-y-4 py-4">
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={formParcelada.descricao}
                        onChange={(e) => setFormParcelada({ ...formParcelada, descricao: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Valor Total (R$)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formParcelada.valorTotal}
                        onChange={(e) => setFormParcelada({ ...formParcelada, valorTotal: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Número de Parcelas</Label>
                      <Input
                        type="number"
                        min="1"
                        value={formParcelada.numParcelas}
                        onChange={(e) => setFormParcelada({ ...formParcelada, numParcelas: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Cadastrar</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {parceladas.length === 0 ? (
              <div className="bg-card border border-border/50 rounded-xl p-12 text-center">
                <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma parcelada</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parceladas.map((parc) => (
                  <div key={parc.id} className="bg-card border border-border/50 rounded-xl p-6">
                    <h3 className="font-semibold text-lg mb-2">{parc.descricao}</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      Parcela {parc.parcela_atual} de {parc.num_parcelas}
                    </p>
                    <p className="font-mono font-semibold text-red-500 text-xl mb-2">
                      {formatCurrency(parc.valor_parcela)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total: {formatCurrency(parc.valor_total)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(parc.id, 'parcelada')}
                      className="w-full mt-4 text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
