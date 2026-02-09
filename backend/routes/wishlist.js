const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar wishlist
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.item, w.valor_estimado, w.necessidade, w.desejo,
              w.created_at, c.id as caixinha_id, c.nome_caixinha, c.saldo_disponivel
       FROM wishlist w
       LEFT JOIN caixinhas c ON w.caixinha_id = c.id
       WHERE w.user_id = $1
       ORDER BY (w.necessidade + w.desejo) DESC, w.created_at DESC`,
      [req.userId]
    );

    const items = result.rows.map(item => {
      let mesesParaComprar = null;
      if (item.saldo_disponivel && item.saldo_disponivel > 0) {
        mesesParaComprar = Math.ceil(item.valor_estimado / item.saldo_disponivel);
      }

      return {
        ...item,
        meses_para_comprar: mesesParaComprar,
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

      const { item, valorEstimado, necessidade, desejo, caixinhaId } = req.body;

      const result = await pool.query(
        `INSERT INTO wishlist (user_id, item, valor_estimado, necessidade, desejo, caixinha_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.userId, item, valorEstimado, necessidade, desejo, caixinhaId || null]
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
    const { item, valorEstimado, necessidade, desejo, caixinhaId } = req.body;

    const result = await pool.query(
      `UPDATE wishlist 
       SET item = COALESCE($1, item),
           valor_estimado = COALESCE($2, valor_estimado),
           necessidade = COALESCE($3, necessidade),
           desejo = COALESCE($4, desejo),
           caixinha_id = COALESCE($5, caixinha_id)
       WHERE id = $6 AND user_id = $7
       RETURNING *`,
      [item, valorEstimado, necessidade, desejo, caixinhaId, id, req.userId]
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
