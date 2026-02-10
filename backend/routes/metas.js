const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ========================
// METAS (GOALS)
// ========================

// Listar metas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT m.*, c.nome_caixinha,
             CASE 
               WHEN m.valor_alvo > 0 THEN ROUND((m.valor_atual / m.valor_alvo * 100)::numeric, 2)
               ELSE 0 
             END as percentual_concluido,
             CASE 
               WHEN m.data_limite IS NOT NULL AND m.data_limite > CURRENT_DATE 
               THEN (m.data_limite - CURRENT_DATE)
               ELSE 0 
             END as dias_restantes
      FROM metas m
      LEFT JOIN caixinhas c ON m.caixinha_id = c.id
      WHERE m.user_id = $1
    `;
    
    const params = [req.userId];
    
    if (status) {
      query += ' AND m.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY m.prioridade DESC, m.data_limite ASC NULLS LAST';
    
    const result = await pool.query(query, params);

    // Calcular valor mensal necessário para cada meta
    const metas = result.rows.map(meta => {
      let valorMensalNecessario = 0;
      if (meta.data_limite && meta.status === 'ativa') {
        const hoje = new Date();
        const dataLimite = new Date(meta.data_limite);
        const mesesRestantes = Math.max(
          (dataLimite.getFullYear() - hoje.getFullYear()) * 12 + 
          (dataLimite.getMonth() - hoje.getMonth()),
          1
        );
        const valorFaltante = parseFloat(meta.valor_alvo) - parseFloat(meta.valor_atual);
        valorMensalNecessario = valorFaltante > 0 ? valorFaltante / mesesRestantes : 0;
      }
      return {
        ...meta,
        valor_mensal_necessario: valorMensalNecessario.toFixed(2)
      };
    });

    res.json(metas);
  } catch (error) {
    console.error('Erro ao listar metas:', error);
    res.status(500).json({ error: 'Erro ao listar metas' });
  }
});

// Criar meta
router.post('/',
  authMiddleware,
  [
    body('nome').trim().notEmpty(),
    body('valorAlvo').isFloat({ min: 0.01 }),
    body('prioridade').optional().isInt({ min: 1, max: 5 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, descricao, valorAlvo, dataLimite, caixinhaId, prioridade, cor } = req.body;

      const result = await pool.query(
        `INSERT INTO metas (user_id, nome, descricao, valor_alvo, data_limite, caixinha_id, prioridade, cor)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          req.userId, 
          nome, 
          descricao || null, 
          valorAlvo, 
          dataLimite || null, 
          caixinhaId || null, 
          prioridade || 1,
          cor || '#10B981'
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      res.status(500).json({ error: 'Erro ao criar meta' });
    }
  }
);

// Atualizar meta
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, valorAlvo, dataLimite, caixinhaId, prioridade, cor, status } = req.body;

    const result = await pool.query(
      `UPDATE metas 
       SET nome = COALESCE($1, nome),
           descricao = COALESCE($2, descricao),
           valor_alvo = COALESCE($3, valor_alvo),
           data_limite = COALESCE($4, data_limite),
           caixinha_id = $5,
           prioridade = COALESCE($6, prioridade),
           cor = COALESCE($7, cor),
           status = COALESCE($8, status)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [nome, descricao, valorAlvo, dataLimite, caixinhaId, prioridade, cor, status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    res.status(500).json({ error: 'Erro ao atualizar meta' });
  }
});

// Deletar meta
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM metas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    res.json({ message: 'Meta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar meta:', error);
    res.status(500).json({ error: 'Erro ao deletar meta' });
  }
});

// ========================
// APORTES NAS METAS
// ========================

// Fazer aporte em uma meta
router.post('/:id/aportar',
  authMiddleware,
  [
    body('valor').isFloat({ min: 0.01 }),
    body('dataAporte').isDate()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { valor, dataAporte, observacao, caixinhaId } = req.body;

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Verificar se meta existe
        const metaResult = await client.query(
          'SELECT * FROM metas WHERE id = $1 AND user_id = $2',
          [id, req.userId]
        );

        if (metaResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Meta não encontrada' });
        }

        const meta = metaResult.rows[0];

        // Criar aporte
        await client.query(
          `INSERT INTO aportes_metas (meta_id, valor, data_aporte, observacao)
           VALUES ($1, $2, $3, $4)`,
          [id, valor, dataAporte, observacao || null]
        );

        // Atualizar valor atual da meta
        const novoValor = parseFloat(meta.valor_atual) + parseFloat(valor);
        const novoStatus = novoValor >= parseFloat(meta.valor_alvo) ? 'concluida' : meta.status;

        await client.query(
          `UPDATE metas SET valor_atual = $1, status = $2 WHERE id = $3`,
          [novoValor, novoStatus, id]
        );

        // Se caixinhaId foi fornecido, debitar da caixinha
        if (caixinhaId) {
          await client.query(
            `UPDATE caixinhas 
             SET valor_gasto = valor_gasto + $1,
                 saldo_disponivel = valor_alocado - (valor_gasto + $1)
             WHERE id = $2`,
            [valor, caixinhaId]
          );
        }

        await client.query('COMMIT');

        // Retornar meta atualizada
        const updatedMeta = await pool.query(
          'SELECT * FROM metas WHERE id = $1',
          [id]
        );

        res.json({
          message: novoStatus === 'concluida' ? 'Meta concluída!' : 'Aporte registrado com sucesso',
          meta: updatedMeta.rows[0]
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao fazer aporte:', error);
      res.status(500).json({ error: 'Erro ao fazer aporte' });
    }
  }
);

// Listar aportes de uma meta
router.get('/:id/aportes', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se meta pertence ao usuário
    const metaCheck = await pool.query(
      'SELECT id FROM metas WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (metaCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Meta não encontrada' });
    }

    const result = await pool.query(
      `SELECT * FROM aportes_metas 
       WHERE meta_id = $1 
       ORDER BY data_aporte DESC`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar aportes:', error);
    res.status(500).json({ error: 'Erro ao listar aportes' });
  }
});

// Resumo das metas
router.get('/estatisticas/resumo', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         COUNT(*) as total_metas,
         COUNT(CASE WHEN status = 'ativa' THEN 1 END) as ativas,
         COUNT(CASE WHEN status = 'concluida' THEN 1 END) as concluidas,
         COALESCE(SUM(CASE WHEN status = 'ativa' THEN valor_alvo ELSE 0 END), 0) as total_alvo_ativas,
         COALESCE(SUM(CASE WHEN status = 'ativa' THEN valor_atual ELSE 0 END), 0) as total_poupado_ativas
       FROM metas
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
