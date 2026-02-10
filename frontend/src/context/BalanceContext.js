import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { useAuth } from './AuthContext';

const BalanceContext = createContext(null);

export const useBalance = () => {
  const context = useContext(BalanceContext);
  if (!context) {
    throw new Error('useBalance deve ser usado dentro de BalanceProvider');
  }
  return context;
};

export const BalanceProvider = ({ children }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState({
    saldo_consolidado: 0,
    contas: { saldo_total_contas: 0, total_contas: 0 },
    caixinhas: { total_disponivel: 0, total_alocado: 0, total_gasto: 0 },
    dividas: { total_devido: 0, total_dividas: 0 },
    cartoes: { total_utilizado_cartoes: 0, limite_total: 0 },
    metas: { metas_ativas: 0, total_poupado_metas: 0 },
    transacoes: { total_entradas: 0, total_saidas: 0 }
  });
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const mesAtual = new Date().toISOString().slice(0, 7);
      const response = await api.get(`/api/dashboards/resumo-geral?mes=${mesAtual}`);
      
      if (response.data) {
        setBalance({
          saldo_consolidado: response.data.saldo_consolidado || 0,
          contas: response.data.contas || { saldo_total_contas: 0, total_contas: 0 },
          caixinhas: response.data.caixinhas || { total_disponivel: 0, total_alocado: 0, total_gasto: 0 },
          dividas: response.data.dividas || { total_devido: 0, total_dividas: 0 },
          cartoes: response.data.cartoes || { total_utilizado_cartoes: 0, limite_total: 0 },
          metas: response.data.metas || { metas_ativas: 0, total_poupado_metas: 0 },
          transacoes: response.data.transacoes || { total_entradas: 0, total_saidas: 0 }
        });
      }
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      // Manter valores anteriores em caso de erro
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  const refreshBalance = () => {
    fetchBalance();
  };

  return (
    <BalanceContext.Provider value={{ balance, loading, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
};
