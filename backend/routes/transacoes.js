const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar transações
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { dataInicio, dataFim, tipo, caixinhaId } = req.query;
    
    let query = `
      SELECT t.id, t.tipo, t.valor, t.descricao, t.data, t.created_at,
             t.categoria_id, t.metodo_pagamento, t.conta_id, t.cartao_id,
             t.parcela_numero, t.total_parcelas,
             c.nome_caixinha,
             cat.nome as categoria_nome, cat.icone as categoria_icone, cat.cor as categoria_cor,
             con.nome as conta_nome,
             car.nome as cartao_nome
      FROM transacoes t
      LEFT JOIN caixinhas c ON t.caixinha_id = c.id
      LEFT JOIN categorias cat ON t.categoria_id = cat.id
      LEFT JOIN contas con ON t.conta_id = con.id
      LEFT JOIN cartoes car ON t.cartao_id = car.id
      WHERE t.user_id = $1
    `;
    
    const params = [req.userId];
    let paramCount = 1;

    if (dataInicio) {
      paramCount++;
      query += ` AND t.data >= $${paramCount}`;
      params.push(dataInicio);
    }

    if (dataFim) {
      paramCount++;
      query += ` AND t.data <= $${paramCount}`;
      params.push(dataFim);
    }

    if (tipo) {
      paramCount++;
      query += ` AND t.tipo = $${paramCount}`;
      params.push(tipo);
    }

    if (caixinhaId) {
      paramCount++;
      query += ` AND t.caixinha_id = $${paramCount}`;
      params.push(caixinhaId);
    }

    query += ' ORDER BY t.data DESC, t.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar transações:', error.stack || error);
    res.status(500).json({ error: 'Erro ao listar transações' });
  }
});

// Criar transação
router.post('/',
  authMiddleware,
  [
    body('tipo').isIn(['entrada', 'saida']),
    body('valor').isFloat({ min: 0.01 }),
    body('data').isDate(),
    body('descricao').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tipo, valor, descricao, caixinhaId, data } = req.body;

      if (tipo === 'saida' && !caixinhaId) {
        return res.status(400).json({ error: 'Saídas devem estar vinculadas a uma caixinha' });
      }

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        const transacaoResult = await client.query(
          `INSERT INTO transacoes (user_id, tipo, valor, descricao, caixinha_id, data)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [req.userId, tipo, valor, descricao || null, caixinhaId || null, data]
        );

        const transacao = transacaoResult.rows[0];

        if (tipo === 'entrada') {
          const mes = data.slice(0, 7);
          const caixinhasResult = await client.query(
            'SELECT id, porcentagem_alvo, valor_alocado, valor_gasto FROM caixinhas WHERE user_id = $1 AND mes_referencia = $2',
            [req.userId, mes]
          );

          for (const caixinha of caixinhasResult.rows) {
            const valorAlocado = (valor * caixinha.porcentagem_alvo) / 100;
            const novoValorAlocado = parseFloat(caixinha.valor_alocado) + valorAlocado;

            await client.query(
              `UPDATE caixinhas 
               SET valor_alocado = $1,
                   saldo_disponivel = $1 - valor_gasto
               WHERE id = $2`,
              [novoValorAlocado, caixinha.id]
            );
          }
        } else if (tipo === 'saida' && caixinhaId) {
          await client.query(
            `UPDATE caixinhas 
             SET valor_gasto = valor_gasto + $1,
                 saldo_disponivel = valor_alocado - (valor_gasto + $1)
             WHERE id = $2`,
            [valor, caixinhaId]
          );
        }

        await client.query('COMMIT');
        res.status(201).json(transacao);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao criar transação:', error.stack || error);
      res.status(500).json({ error: 'Erro ao criar transação' });
    }
  }
);

// Editar transação
router.put('/:id',
  authMiddleware,
  [
    body('tipo').optional().isIn(['entrada', 'saida']),
    body('valor').optional().isFloat({ min: 0.01 }),
    body('data').optional().isDate()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { tipo, valor, descricao, caixinhaId, data, categoriaId, metodoPagamento, contaId, cartaoId } = req.body;

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Buscar transação original
        const transacaoOriginal = await client.query(
          'SELECT * FROM transacoes WHERE id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (transacaoOriginal.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Transação não encontrada' });
        }

        const original = transacaoOriginal.rows[0];

        // Reverter o efeito da transação original na caixinha
        if (original.tipo === 'saida' && original.caixinha_id) {
          await client.query(
            `UPDATE caixinhas 
             SET valor_gasto = valor_gasto - $1,
                 saldo_disponivel = valor_alocado - (valor_gasto - $1)
             WHERE id = $2`,
            [original.valor, original.caixinha_id]
          );
        }

        // Atualizar transação
        const novoTipo = tipo || original.tipo;
        const novoValor = valor !== undefined ? valor : original.valor;
        const novaCaixinhaId = caixinhaId !== undefined ? caixinhaId : original.caixinha_id;

        const updateResult = await client.query(
          `UPDATE transacoes 
           SET tipo = $1,
               valor = $2,
               descricao = COALESCE($3, descricao),
               caixinha_id = $4,
               data = COALESCE($5, data),
               categoria_id = $6,
               metodo_pagamento = COALESCE($7, metodo_pagamento),
               conta_id = $8,
               cartao_id = $9
           WHERE id = $10 AND user_id = $11
           RETURNING *`,
          [
            novoTipo,
            novoValor,
            descricao,
            novaCaixinhaId,
            data,
            categoriaId || original.categoria_id,
            metodoPagamento,
            contaId || original.conta_id,
            cartaoId || original.cartao_id,
            id,
            req.userId
          ]
        );

        // Aplicar novo efeito na caixinha
        if (novoTipo === 'saida' && novaCaixinhaId) {
          await client.query(
            `UPDATE caixinhas 
             SET valor_gasto = valor_gasto + $1,
                 saldo_disponivel = valor_alocado - (valor_gasto + $1)
             WHERE id = $2`,
            [novoValor, novaCaixinhaId]
          );
        }

        await client.query('COMMIT');
        res.json(updateResult.rows[0]);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao editar transação:', error.stack || error);
      res.status(500).json({ error: 'Erro ao editar transação' });
    }
  }
);

// Deletar transação
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const transacaoResult = await client.query(
        'SELECT tipo, valor, caixinha_id, data FROM transacoes WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );

      if (transacaoResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Transação não encontrada' });
      }

      const { tipo, valor, caixinha_id, data } = transacaoResult.rows[0];

      if (tipo === 'saida' && caixinha_id) {
        await client.query(
          `UPDATE caixinhas 
           SET valor_gasto = valor_gasto - $1,
               saldo_disponivel = valor_alocado - (valor_gasto - $1)
           WHERE id = $2`,
          [valor, caixinha_id]
        );
      } else if (tipo === 'entrada') {
        const mes = data.toISOString().slice(0, 7);
        const caixinhasResult = await client.query(
          'SELECT id, porcentagem_alvo, valor_alocado, valor_gasto FROM caixinhas WHERE user_id = $1 AND mes_referencia = $2',
          [req.userId, mes]
        );

        for (const caixinha of caixinhasResult.rows) {
          const valorAlocado = (valor * caixinha.porcentagem_alvo) / 100;
          const novoValorAlocado = parseFloat(caixinha.valor_alocado) - valorAlocado;

          await client.query(
            `UPDATE caixinhas 
             SET valor_alocado = $1,
                 saldo_disponivel = $1 - valor_gasto
             WHERE id = $2`,
            [novoValorAlocado, caixinha.id]
          );
        }
      }

      await client.query(
        'DELETE FROM transacoes WHERE id = $1',
        [id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Transação deletada com sucesso' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao deletar transação:', error.stack || error);
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

// Estatísticas do mês
router.get('/estatisticas', authMiddleware, async (req, res) => {
  try {
    const mes = req.query.mes || new Date().toISOString().slice(0, 7);
    const [ano, mesNum] = mes.split('-').map(Number);
    
    // Usar o último dia real do mês para evitar erros como '2026-02-31'
    const ultimoDia = new Date(ano, mesNum, 0).getDate();
    const dataInicio = `${mes}-01`;
    const dataFim = `${mes}-${ultimoDia.toString().padStart(2, '0')}`;

    const result = await pool.query(
      `SELECT 
         SUM(CASE WHEN tipo = 'entrada' THEN valor ELSE 0 END) as total_entradas,
         SUM(CASE WHEN tipo = 'saida' THEN valor ELSE 0 END) as total_saidas,
         COUNT(CASE WHEN tipo = 'entrada' THEN 1 END) as num_entradas,
         COUNT(CASE WHEN tipo = 'saida' THEN 1 END) as num_saidas
       FROM transacoes
       WHERE user_id = $1 AND data >= $2 AND data <= $3`,
      [req.userId, dataInicio, dataFim]
    );

    const stats = result.rows[0];
    res.json({
      total_entradas: parseFloat(stats.total_entradas) || 0,
      total_saidas: parseFloat(stats.total_saidas) || 0,
      saldo: (parseFloat(stats.total_entradas) || 0) - (parseFloat(stats.total_saidas) || 0),
      num_entradas: parseInt(stats.num_entradas) || 0,
      num_saidas: parseInt(stats.num_saidas) || 0
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error.stack);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

module.exports = router;
