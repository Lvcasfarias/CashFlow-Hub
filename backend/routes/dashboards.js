const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Fluxo de caixa (periodo flexivel)
router.get('/fluxo-caixa', authMiddleware, async (req, res) => {
  try {
    const meses = parseInt(req.query.meses) || 6;
    const { dataInicio, dataFim } = req.query;
    
    let query;
    let params;
    
    if (dataInicio && dataFim) {
      query = `SELECT 
         TO_CHAR(data, 'YYYY-MM') as mes,
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
         COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas,
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo
       FROM transacoes
       WHERE user_id = $1 
         AND data >= $2 AND data <= $3
       GROUP BY TO_CHAR(data, 'YYYY-MM')
       ORDER BY mes ASC`;
      params = [req.userId, dataInicio, dataFim];
    } else {
      query = `SELECT 
         TO_CHAR(data, 'YYYY-MM') as mes,
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as entradas,
         COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as saidas,
         COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE -valor END), 0) as saldo
       FROM transacoes
       WHERE user_id = $1 
         AND data >= CURRENT_DATE - INTERVAL '${meses} months'
       GROUP BY TO_CHAR(data, 'YYYY-MM')
       ORDER BY mes ASC`;
      params = [req.userId];
    }

    const result = await pool.query(query, params);
    res.json(result.rows || []);
  } catch (error) {
    console.error('Erro ao obter fluxo de caixa:', error);
    res.status(500).json({ error: 'Erro ao obter fluxo de caixa' });
  }
});

// Distribuicao por categorias (caixinhas)
router.get('/distribuicao-categorias', authMiddleware, async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    
    const result = await pool.query(
      `SELECT 
         c.nome_caixinha as nome,
         COALESCE(SUM(c.valor_gasto), 0) as valor
       FROM caixinhas c
       WHERE c.user_id = $1 AND c.mes_referencia = $2
       GROUP BY c.nome_caixinha
       HAVING COALESCE(SUM(c.valor_gasto), 0) > 0
       ORDER BY valor DESC`,
      [req.userId, mes]
    );

    res.json(result.rows || []);
  } catch (error) {
    console.error('Erro ao obter distribuicao:', error);
    res.status(500).json({ error: 'Erro ao obter distribuicao' });
  }
});

// Evolução de dívidas
router.get('/evolucao-dividas', authMiddleware, async (req, res) => {
  try {
    // Obter dívidas e suas amortizações
    const result = await pool.query(
      `SELECT 
         d.id,
         d.descricao,
         d.valor_original,
         d.valor_atual,
         d.data_inicio,
         d.status,
         COALESCE(
           (SELECT json_agg(
             json_build_object(
               'data', a.data_pagamento,
               'valor', a.valor
             ) ORDER BY a.data_pagamento
           )
           FROM amortizacoes a
           WHERE a.divida_id = d.id
         ), '[]'::json) as amortizacoes
       FROM dividas d
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao obter evolução de dívidas:', error);
    res.status(500).json({ error: 'Erro ao obter evolução de dívidas' });
  }
});

// Projecao futura (periodo flexivel)
router.get('/projecao-futura', authMiddleware, async (req, res) => {
  try {
    const numMeses = parseInt(req.query.meses) || 6;
    const meses = [];
    const hoje = new Date();
    
    for (let i = 0; i < numMeses; i++) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
      meses.push(data.toISOString().slice(0, 7));
    }

    // Obter recorrencias ativas
    const recorrencias = await pool.query(
      `SELECT tipo, valor FROM recorrencias 
       WHERE user_id = $1 AND ativo = true`,
      [req.userId]
    );

    // Obter parceladas ativas
    const parceladas = await pool.query(
      `SELECT valor_parcela, num_parcelas, COALESCE(parcelas_pagas, 0) as parcelas_pagas 
       FROM parceladas 
       WHERE user_id = $1 AND ativo = true`,
      [req.userId]
    );

    // Calcular projecao
    const projecao = meses.map((mes, index) => {
      let entradasPrevistas = 0;
      let saidasPrevistas = 0;

      // Adicionar recorrencias
      if (recorrencias.rows) {
        recorrencias.rows.forEach(rec => {
          if (rec.tipo === 'entrada') {
            entradasPrevistas += parseFloat(rec.valor) || 0;
          } else {
            saidasPrevistas += parseFloat(rec.valor) || 0;
          }
        });
      }

      // Adicionar parcelas
      if (parceladas.rows) {
        parceladas.rows.forEach(parc => {
          const parcelasRestantes = (parc.num_parcelas || 0) - (parc.parcelas_pagas || 0);
          if (index < parcelasRestantes) {
            saidasPrevistas += parseFloat(parc.valor_parcela) || 0;
          }
        });
      }

      const saldoProjetado = entradasPrevistas - saidasPrevistas;

      return {
        mes,
        entradas_previstas: entradasPrevistas,
        saidas_previstas: saidasPrevistas,
        saldo_projetado: saldoProjetado
      };
    });

    res.json(projecao);
  } catch (error) {
    console.error('Erro ao calcular projecao:', error);
    res.status(500).json({ error: 'Erro ao calcular projecao' });
  }
});

// Resumo geral para dashboard principal
router.get('/resumo-geral', authMiddleware, async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);

    const [transacoes, caixinhas, dividas, recorrencias, contas, cartoes, metas] = await Promise.all([
      pool.query(
        `SELECT 
           COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END), 0) as total_entradas,
           COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas
         FROM transacoes
         WHERE user_id = $1 AND TO_CHAR(data, 'YYYY-MM') = $2`,
        [req.userId, mes]
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(valor_alocado), 0) as total_alocado,
           COALESCE(SUM(valor_gasto), 0) as total_gasto,
           COALESCE(SUM(saldo_disponivel), 0) as total_disponivel
         FROM caixinhas
         WHERE user_id = $1 AND mes_referencia = $2`,
        [req.userId, mes]
      ),
      pool.query(
        `SELECT 
           COUNT(*) as total_dividas,
           COALESCE(SUM(CASE WHEN status != 'quitado' THEN valor_atual ELSE 0 END), 0) as total_devido
         FROM dividas
         WHERE user_id = $1`,
        [req.userId]
      ),
      pool.query(
        `SELECT 
           COUNT(*) as total_fixas,
           COALESCE(SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END), 0) as total_saidas_fixas
         FROM recorrencias
         WHERE user_id = $1 AND ativo = true`,
        [req.userId]
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(saldo_atual), 0) as saldo_total_contas,
           COUNT(*) as total_contas
         FROM contas
         WHERE user_id = $1 AND ativo = true`,
        [req.userId]
      ),
      pool.query(
        `SELECT 
           COALESCE(SUM(limite), 0) as limite_total,
           COALESCE(SUM(limite - limite_disponivel), 0) as total_utilizado_cartoes
         FROM cartoes
         WHERE user_id = $1 AND ativo = true`,
        [req.userId]
      ),
      pool.query(
        `SELECT 
           COUNT(CASE WHEN status = 'ativa' THEN 1 END) as metas_ativas,
           COALESCE(SUM(CASE WHEN status = 'ativa' THEN valor_atual ELSE 0 END), 0) as total_poupado_metas
         FROM metas
         WHERE user_id = $1`,
        [req.userId]
      )
    ]);

    // Calcular saldo consolidado
    const saldoContas = parseFloat(contas.rows[0].saldo_total_contas) || 0;
    const caixinhasDisponivel = parseFloat(caixinhas.rows[0].total_disponivel) || 0;
    const dividasDevido = parseFloat(dividas.rows[0].total_devido) || 0;
    const utilizadoCartoes = parseFloat(cartoes.rows[0].total_utilizado_cartoes) || 0;
    
    const saldoConsolidado = saldoContas + caixinhasDisponivel - dividasDevido - utilizadoCartoes;

    res.json({
      transacoes: transacoes.rows[0],
      caixinhas: caixinhas.rows[0],
      dividas: dividas.rows[0],
      recorrencias: recorrencias.rows[0],
      contas: contas.rows[0],
      cartoes: cartoes.rows[0],
      metas: metas.rows[0],
      saldo_consolidado: saldoConsolidado
    });
  } catch (error) {
    console.error('Erro ao obter resumo geral:', error);
    res.status(500).json({ error: 'Erro ao obter resumo geral' });
  }
});

module.exports = router;
