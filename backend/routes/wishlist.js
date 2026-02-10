const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = `
      SELECT w.id, w.item, w.valor_estimado, w.necessidade, w.desejo,
             w.aporte_mensal, w.data_prevista, w.status,
             w.created_at, c.id as caixinha_id, c.nome_caixinha, c.saldo_disponivel
      FROM wishlist w
      LEFT JOIN caixinhas c ON w.caixinha_id = c.id
      WHERE w.user_id = $1
    `;
    
    const params = [req.userId];
    
    if (status) {
      query += ' AND w.status = $2';
      params.push(status);
    }
    
    query += ' ORDER BY (w.necessidade + w.desejo) DESC, w.created_at DESC';

    const result = await pool.query(query, params);

    const items = result.rows.map(item => {
      let mesesParaComprar = null;
      let dataEstimada = null;
      
      // Calcular baseado no aporte mensal definido
      if (item.aporte_mensal && item.aporte_mensal > 0) {
        mesesParaComprar = Math.ceil(item.valor_estimado / item.aporte_mensal);
        const hoje = new Date();
        dataEstimada = new Date(hoje.setMonth(hoje.getMonth() + mesesParaComprar));
      } else if (item.saldo_disponivel && item.saldo_disponivel > 0) {
        // Fallback: usar saldo disponível da caixinha
        mesesParaComprar = Math.ceil(item.valor_estimado / item.saldo_disponivel);
      }

      return {
        ...item,
        meses_para_comprar: mesesParaComprar,
        data_estimada_compra: dataEstimada,
        prioridade_score: item.necessidade + item.desejo
      };
    });

    res.json(items);
  } catch (error) {
    console.error('Erro ao listar wishlist:', error);
    res.status(500).json({ error: 'Erro ao listar wishlist' });
  }
});

// Criar item na wishlist
router.post('/',
  authMiddleware,
  [
    body('item').trim().notEmpty(),
    body('valorEstimado').isFloat({ min: 0.01 }),
    body('necessidade').isInt({ min: 1, max: 5 }),
    body('desejo').isInt({ min: 1, max: 5 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { item, valorEstimado, necessidade, desejo, caixinhaId, aporteMensal } = req.body;

      // Calcular data prevista se aporte mensal informado
      let dataPrevista = null;
      if (aporteMensal && aporteMensal > 0) {
        const meses = Math.ceil(valorEstimado / aporteMensal);
        const hoje = new Date();
        dataPrevista = new Date(hoje.setMonth(hoje.getMonth() + meses));
      }

      const result = await pool.query(
        `INSERT INTO wishlist (user_id, item, valor_estimado, necessidade, desejo, caixinha_id, aporte_mensal, data_prevista)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.userId, item, valorEstimado, necessidade, desejo, caixinhaId || null, aporteMensal || 0, dataPrevista]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar item na wishlist:', error);
      res.status(500).json({ error: 'Erro ao criar item na wishlist' });
    }
  }
);

// Atualizar item da wishlist
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { item, valorEstimado, necessidade, desejo, caixinhaId, aporteMensal, status } = req.body;

    // Recalcular data prevista se necessário
    let dataPrevista = null;
    if (aporteMensal && aporteMensal > 0 && valorEstimado) {
      const meses = Math.ceil(valorEstimado / aporteMensal);
      const hoje = new Date();
      dataPrevista = new Date(hoje.setMonth(hoje.getMonth() + meses));
    }

    const result = await pool.query(
      `UPDATE wishlist 
       SET item = COALESCE($1, item),
           valor_estimado = COALESCE($2, valor_estimado),
           necessidade = COALESCE($3, necessidade),
           desejo = COALESCE($4, desejo),
           caixinha_id = $5,
           aporte_mensal = COALESCE($6, aporte_mensal),
           data_prevista = $7,
           status = COALESCE($8, status)
       WHERE id = $9 AND user_id = $10
       RETURNING *`,
      [item, valorEstimado, necessidade, desejo, caixinhaId, aporteMensal, dataPrevista, status, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar item da wishlist:', error);
    res.status(500).json({ error: 'Erro ao atualizar item da wishlist' });
  }
});

// Marcar como comprado
router.post('/:id/comprar', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { caixinhaId, valorReal } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Buscar item
      const itemResult = await client.query(
        'SELECT * FROM wishlist WHERE id = $1 AND user_id = $2',
        [id, req.userId]
      );

      if (itemResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      const wishlistItem = itemResult.rows[0];
      const valor = valorReal || wishlistItem.valor_estimado;

      // Atualizar status
      await client.query(
        `UPDATE wishlist SET status = 'comprado' WHERE id = $1`,
        [id]
      );

      // Se caixinhaId fornecido, debitar
      if (caixinhaId) {
        await client.query(
          `UPDATE caixinhas 
           SET valor_gasto = valor_gasto + $1,
               saldo_disponivel = valor_alocado - (valor_gasto + $1)
           WHERE id = $2`,
          [valor, caixinhaId]
        );

        // Criar transação
        await client.query(
          `INSERT INTO transacoes (user_id, tipo, valor, descricao, caixinha_id, data)
           VALUES ($1, 'saida', $2, $3, $4, CURRENT_DATE)`,
          [req.userId, valor, `Compra: ${wishlistItem.item}`, caixinhaId]
        );
      }

      await client.query('COMMIT');

      res.json({ message: 'Item marcado como comprado!' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao marcar como comprado:', error);
    res.status(500).json({ error: 'Erro ao marcar como comprado' });
  }
});

// Deletar item da wishlist
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM wishlist WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item não encontrado' });
    }

    res.json({ message: 'Item deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar item da wishlist:', error);
    res.status(500).json({ error: 'Erro ao deletar item da wishlist' });
  }
});

module.exports = router;
