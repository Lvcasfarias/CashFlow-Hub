const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar dívidas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT d.id, d.descricao, d.valor_original, d.valor_atual, d.juros_mensal,
             d.status, d.data_inicio, d.data_quitacao, c.nome_caixinha
      FROM dividas d
      LEFT JOIN caixinhas c ON d.caixinha_id = c.id
      WHERE d.user_id = $1
    `;
    
    const params = [req.userId];
    
    if (status) {
      query += ' AND d.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY d.status ASC, d.created_at DESC';
    
    const result = await pool.query(query, params);
    
    // Calcular percentual pago para cada dívida
    const dividas = result.rows.map(divida => ({
      ...divida,
      percentual_pago: divida.valor_original > 0 
        ? ((divida.valor_original - divida.valor_atual) / divida.valor_original * 100).toFixed(2)
        : 0
    }));
    
    res.json(dividas);
  } catch (error) {
    console.error('Erro ao listar dívidas:', error);
    res.status(500).json({ error: 'Erro ao listar dívidas' });
  }
});

// Criar dívida
router.post('/',
  authMiddleware,
  [
    body('descricao').trim().notEmpty(),
    body('valorOriginal').isFloat({ min: 0.01 }),
    body('jurosMensal').optional().isFloat({ min: 0, max: 100 }),
    body('dataInicio').isDate()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { descricao, valorOriginal, jurosMensal, dataInicio, caixinhaId } = req.body;

      const result = await pool.query(
        `INSERT INTO dividas (user_id, descricao, valor_original, valor_atual, juros_mensal, data_inicio, caixinha_id)
         VALUES ($1, $2, $3, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, descricao, valorOriginal, jurosMensal || 0, dataInicio, caixinhaId || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar dívida:', error);
      res.status(500).json({ error: 'Erro ao criar dívida' });
    }
  }
);

// Amortizar dívida
router.post('/:id/amortizar',
  authMiddleware,
  [
    body('valor').isFloat({ min: 0.01 }),
    body('dataPagamento').isDate(),
    body('caixinhaId').isInt()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { valor, dataPagamento, caixinhaId, observacao } = req.body;

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Verificar se dívida existe e obter dados
        const dividaResult = await client.query(
          'SELECT valor_atual, status FROM dividas WHERE id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (dividaResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Dívida não encontrada' });
        }

        const divida = dividaResult.rows[0];

        if (divida.status === 'quitado') {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Dívida já está quitada' });
        }

        // Criar registro de amortização
        await client.query(
          `INSERT INTO amortizacoes (divida_id, valor, data_pagamento, caixinha_id, observacao)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, valor, dataPagamento, caixinhaId, observacao || null]
        );

        // Atualizar valor atual da dívida
        const novoValor = parseFloat(divida.valor_atual) - parseFloat(valor);
        const novoStatus = novoValor <= 0 ? 'quitado' : divida.status;
        const dataQuitacao = novoValor <= 0 ? dataPagamento : null;

        await client.query(
          `UPDATE dividas 
           SET valor_atual = $1, status = $2, data_quitacao = $3
           WHERE id = $4`,
          [Math.max(novoValor, 0), novoStatus, dataQuitacao, id]
        );

        // Debitar da caixinha
        await client.query(
          `UPDATE caixinhas 
           SET valor_gasto = valor_gasto + $1,
               saldo_disponivel = valor_alocado - (valor_gasto + $1)
           WHERE id = $2`,
          [valor, caixinhaId]
        );

        await client.query('COMMIT');

        // Buscar dívida atualizada
        const updatedResult = await pool.query(
          'SELECT * FROM dividas WHERE id = $1',
          [id]
        );

        res.json(updatedResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao amortizar dívida:', error);
      res.status(500).json({ error: 'Erro ao amortizar dívida' });
    }
  }
);

// Atualizar status da dívida
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'negociando', 'quitado'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const result = await pool.query(
      `UPDATE dividas 
       SET status = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Listar histórico de amortizações
router.get('/:id/amortizacoes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT a.id, a.valor, a.data_pagamento, a.observacao, c.nome_caixinha
       FROM amortizacoes a
       LEFT JOIN caixinhas c ON a.caixinha_id = c.id
       WHERE a.divida_id = $1
       ORDER BY a.data_pagamento DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar amortizações:', error);
    res.status(500).json({ error: 'Erro ao listar amortizações' });
  }
});

// Deletar dívida
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM dividas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Dívida não encontrada' });
    }

    res.json({ message: 'Dívida deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar dívida:', error);
    res.status(500).json({ error: 'Erro ao deletar dívida' });
  }
});

// Estatísticas de dívidas
router.get('/estatisticas/resumo', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_dividas,
         COUNT(CASE WHEN status = 'pendente' THEN 1 END) as pendentes,
         COUNT(CASE WHEN status = 'negociando' THEN 1 END) as negociando,
         COUNT(CASE WHEN status = 'quitado' THEN 1 END) as quitadas,
         SUM(CASE WHEN status != 'quitado' THEN valor_atual ELSE 0 END) as total_devido,
         SUM(valor_original) as total_original
       FROM dividas
       WHERE user_id = $1`,
      [req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

module.exports = router;
