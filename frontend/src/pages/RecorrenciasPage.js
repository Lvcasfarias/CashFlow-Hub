import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import api from '../lib/api';
import { toast } from 'sonner';
import { Plus, Trash2, Calendar, CreditCard, ToggleLeft, ToggleRight } from 'lucide-react';
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
      toast.success('Conta fixa cadastrada com sucesso!');
      setOpenDialogFixa(false);
      setFormFixa({
        tipo: 'saida',
        valor: '',
        descricao: '',
        diaVencimento: 1,
        frequencia: 'mensal',
        caixinhaId: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar conta fixa');
    }
  };

  const handleSubmitParcelada = async (e) => {
    e.preventDefault();
    
    try {
      await api.post('/api/recorrencias/parceladas', formParcelada);
      toast.success('Compra parcelada cadastrada com sucesso!');
      setOpenDialogParcelada(false);
      setFormParcelada({
        descricao: '',
        valorTotal: '',
        numParcelas: '',
        diaVencimento: 1,
        dataInicio: new Date().toISOString().split('T')[0],
        caixinhaId: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Erro ao cadastrar compra parcelada');
    }
  };

  const handleToggleAtivo = async (id, ativo) => {
    try {
      await api.put(`/api/recorrencias/${id}`, { ativo: !ativo });
      toast.success('Status atualizado!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id, tipo) => {
    if (!window.confirm('Deseja realmente excluir?')) return;

    try {
      if (tipo === 'fixa') {
        await api.delete(`/api/recorrencias/${id}`);
      } else {
        await api.delete(`/api/recorrencias/parceladas/${id}`);
      }
      toast.success('Excluído com sucesso!');
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
        <div className=\"flex items-center justify-center h-96\">
          <div className=\"animate-spin rounded-full h-12 w-12 border-b-2 border-primary\"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className=\"space-y-8\" data-testid=\"recorrencias-page\">
        <div>
          <h1 className=\"text-4xl md:text-5xl font-bold tracking-tight\">Recorrências</h1>
          <p className=\"text-muted-foreground mt-2\">Gerencie suas contas fixas e compras parceladas</p>
        </div>

        <Tabs defaultValue=\"fixas\" className=\"w-full\">
          <TabsList className=\"grid w-full max-w-md grid-cols-2\">
            <TabsTrigger value=\"fixas\">Contas Fixas</TabsTrigger>
            <TabsTrigger value=\"parceladas\">Parceladas</TabsTrigger>
          </TabsList>

          <TabsContent value=\"fixas\" className=\"space-y-4\">
            <div className=\"flex justify-end\">
              <Dialog open={openDialogFixa} onOpenChange={setOpenDialogFixa}>
                <DialogTrigger asChild>
                  <Button data-testid=\"add-fixa-btn\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Nova Conta Fixa
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Conta Fixa</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitFixa} className=\"space-y-4 py-4\">
                    <div>
                      <Label>Tipo</Label>
                      <Select
                        value={formFixa.tipo}
                        onValueChange={(value) => setFormFixa({ ...formFixa, tipo: value })}
                      >
                        <SelectTrigger data-testid=\"tipo-fixa-select\">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value=\"entrada\">Entrada</SelectItem>
                          <SelectItem value=\"saida\">Saída</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={formFixa.descricao}
                        onChange={(e) => setFormFixa({ ...formFixa, descricao: e.target.value })}
                        placeholder=\"Ex: Aluguel, Salário\"
                        required
                      />
                    </div>

                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type=\"number\"
                        min=\"0\"
                        step=\"0.01\"
                        value={formFixa.valor}
                        onChange={(e) => setFormFixa({ ...formFixa, valor: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label>Dia do Vencimento</Label>
                      <Input
                        type=\"number\"
                        min=\"1\"
                        max=\"31\"
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
                            <SelectValue placeholder=\"Selecione uma caixinha\" />
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

                    <Button type=\"submit\" className=\"w-full\">
                      Cadastrar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {recorrencias.length === 0 ? (
              <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
                <Calendar className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                <h3 className=\"text-xl font-semibold mb-2\">Nenhuma conta fixa cadastrada</h3>
                <p className=\"text-muted-foreground\">Cadastre suas contas mensais recorrentes</p>
              </div>
            ) : (
              <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
                {recorrencias.map((rec) => (
                  <div
                    key={rec.id}
                    className={`bg-card border rounded-xl p-6 transition-all ${
                      rec.ativo ? 'border-border/50' : 'border-border/20 opacity-60'
                    }`}
                  >
                    <div className=\"flex items-start justify-between mb-4\">
                      <div className=\"flex-1\">
                        <h3 className=\"font-semibold text-lg\">{rec.descricao}</h3>
                        <p className=\"text-sm text-muted-foreground mt-1\">
                          Dia {rec.dia_vencimento} • {rec.frequencia}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleAtivo(rec.id, rec.ativo)}
                        className=\"text-muted-foreground hover:text-foreground\"
                      >
                        {rec.ativo ? (
                          <ToggleRight className=\"w-6 h-6 text-primary\" />
                        ) : (
                          <ToggleLeft className=\"w-6 h-6\" />
                        )}
                      </button>
                    </div>

                    <div className=\"space-y-2\">
                      <div className=\"flex justify-between items-center\">
                        <span className=\"text-sm text-muted-foreground\">Valor</span>
                        <span
                          className={`font-mono font-semibold text-lg ${
                            rec.tipo === 'entrada' ? 'text-green-500' : 'text-red-500'
                          }`}
                        >
                          {rec.tipo === 'entrada' ? '+' : '-'}
                          {formatCurrency(rec.valor)}
                        </span>
                      </div>

                      {rec.nome_caixinha && (
                        <div className=\"flex justify-between items-center\">
                          <span className=\"text-sm text-muted-foreground\">Caixinha</span>
                          <span className=\"text-sm font-medium\">{rec.nome_caixinha}</span>
                        </div>
                      )}
                    </div>

                    <Button
                      variant=\"ghost\"
                      size=\"sm\"
                      onClick={() => handleDelete(rec.id, 'fixa')}
                      className=\"w-full mt-4 text-destructive hover:text-destructive\"
                    >
                      <Trash2 className=\"w-4 h-4 mr-2\" />
                      Excluir
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value=\"parceladas\" className=\"space-y-4\">
            <div className=\"flex justify-end\">
              <Dialog open={openDialogParcelada} onOpenChange={setOpenDialogParcelada}>
                <DialogTrigger asChild>
                  <Button data-testid=\"add-parcelada-btn\">
                    <Plus className=\"w-4 h-4 mr-2\" />
                    Nova Parcelada
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Compra Parcelada</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitParcelada} className=\"space-y-4 py-4\">
                    <div>
                      <Label>Descrição</Label>
                      <Input
                        value={formParcelada.descricao}
                        onChange={(e) => setFormParcelada({ ...formParcelada, descricao: e.target.value })}
                        placeholder=\"Ex: Notebook, TV\"
                        required
                      />
                    </div>

                    <div>
                      <Label>Valor Total (R$)</Label>
                      <Input
                        type=\"number\"
                        min=\"0\"
                        step=\"0.01\"
                        value={formParcelada.valorTotal}
                        onChange={(e) => setFormParcelada({ ...formParcelada, valorTotal: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label>Número de Parcelas</Label>
                      <Input
                        type=\"number\"
                        min=\"1\"
                        value={formParcelada.numParcelas}
                        onChange={(e) => setFormParcelada({ ...formParcelada, numParcelas: e.target.value })}
                        required
                      />
                    </div>

                    {formParcelada.valorTotal && formParcelada.numParcelas && (
                      <div className=\"bg-secondary/20 border border-border rounded-lg p-4\">
                        <p className=\"text-sm text-muted-foreground\">Valor da Parcela</p>
                        <p className=\"text-2xl font-bold font-mono text-primary\">
                          {formatCurrency(formParcelada.valorTotal / formParcelada.numParcelas)}
                        </p>
                      </div>
                    )}

                    <div>
                      <Label>Dia do Vencimento</Label>
                      <Input
                        type=\"number\"
                        min=\"1\"
                        max=\"31\"
                        value={formParcelada.diaVencimento}
                        onChange={(e) => setFormParcelada({ ...formParcelada, diaVencimento: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label>Data de Início</Label>
                      <Input
                        type=\"date\"
                        value={formParcelada.dataInicio}
                        onChange={(e) => setFormParcelada({ ...formParcelada, dataInicio: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label>Caixinha</Label>
                      <Select
                        value={formParcelada.caixinhaId}
                        onValueChange={(value) => setFormParcelada({ ...formParcelada, caixinhaId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder=\"Selecione uma caixinha\" />
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

                    <Button type=\"submit\" className=\"w-full\">
                      Cadastrar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {parceladas.length === 0 ? (
              <div className=\"bg-card border border-border/50 rounded-xl p-12 text-center\">
                <CreditCard className=\"w-16 h-16 mx-auto text-muted-foreground mb-4\" />
                <h3 className=\"text-xl font-semibold mb-2\">Nenhuma compra parcelada</h3>
                <p className=\"text-muted-foreground\">Cadastre suas compras parceladas para controle</p>
              </div>
            ) : (
              <div className=\"grid grid-cols-1 md:grid-cols-2 gap-4\">
                {parceladas.map((parc) => {
                  const progresso = (parc.parcela_atual / parc.num_parcelas) * 100;
                  return (
                    <div
                      key={parc.id}
                      className=\"bg-card border border-border/50 rounded-xl p-6\"
                    >
                      <div className=\"flex items-start justify-between mb-4\">
                        <div>
                          <h3 className=\"font-semibold text-lg\">{parc.descricao}</h3>
                          <p className=\"text-sm text-muted-foreground mt-1\">
                            Parcela {parc.parcela_atual} de {parc.num_parcelas}
                          </p>
                        </div>
                        <Button
                          variant=\"ghost\"
                          size=\"sm\"
                          onClick={() => handleDelete(parc.id, 'parcelada')}
                        >
                          <Trash2 className=\"w-4 h-4 text-destructive\" />
                        </Button>
                      </div>

                      <div className=\"space-y-3\">
                        <div className=\"flex justify-between\">
                          <span className=\"text-sm text-muted-foreground\">Valor Total</span>
                          <span className=\"font-mono font-medium\">{formatCurrency(parc.valor_total)}</span>
                        </div>

                        <div className=\"flex justify-between\">
                          <span className=\"text-sm text-muted-foreground\">Parcela</span>
                          <span className=\"font-mono font-semibold text-red-500\">
                            {formatCurrency(parc.valor_parcela)}
                          </span>
                        </div>

                        {parc.nome_caixinha && (
                          <div className=\"flex justify-between\">
                            <span className=\"text-sm text-muted-foreground\">Caixinha</span>
                            <span className=\"text-sm font-medium\">{parc.nome_caixinha}</span>
                          </div>
                        )}

                        <div className=\"pt-2\">
                          <div className=\"flex justify-between text-xs mb-1\">
                            <span className=\"text-muted-foreground\">Progresso</span>
                            <span className=\"font-semibold\">{progresso.toFixed(0)}%</span>
                          </div>
                          <div className=\"w-full bg-secondary rounded-full h-2\">
                            <div
                              className=\"bg-primary h-2 rounded-full transition-all duration-300\"
                              style={{ width: `${progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};
