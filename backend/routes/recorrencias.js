const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar recorrências
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.tipo, r.valor, r.descricao, r.dia_vencimento, 
              r.frequencia, r.ativo, c.nome_caixinha
       FROM recorrencias r
       LEFT JOIN caixinhas c ON r.caixinha_id = c.id
       WHERE r.user_id = $1
       ORDER BY r.dia_vencimento`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar recorrências:', error);
    res.status(500).json({ error: 'Erro ao listar recorrências' });
  }
});

// Criar recorrência
router.post('/',
  authMiddleware,
  [
    body('tipo').isIn(['entrada', 'saida']),
    body('valor').isFloat({ min: 0.01 }),
    body('descricao').trim().notEmpty(),
    body('diaVencimento').isInt({ min: 1, max: 31 }),
    body('frequencia').optional().isIn(['mensal', 'anual'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { tipo, valor, descricao, diaVencimento, frequencia, caixinhaId } = req.body;

      const result = await pool.query(
        `INSERT INTO recorrencias (user_id, tipo, valor, descricao, dia_vencimento, frequencia, caixinha_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.userId, tipo, valor, descricao, diaVencimento, frequencia || 'mensal', caixinhaId || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar recorrência:', error);
      res.status(500).json({ error: 'Erro ao criar recorrência' });
    }
  }
);

// Atualizar recorrência
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { valor, descricao, diaVencimento, frequencia, caixinhaId, ativo } = req.body;

    const result = await pool.query(
      `UPDATE recorrencias 
       SET valor = COALESCE($1, valor),
           descricao = COALESCE($2, descricao),
           dia_vencimento = COALESCE($3, dia_vencimento),
           frequencia = COALESCE($4, frequencia),
           caixinha_id = COALESCE($5, caixinha_id),
           ativo = COALESCE($6, ativo)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [valor, descricao, diaVencimento, frequencia, caixinhaId, ativo, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recorrência não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar recorrência:', error);
    res.status(500).json({ error: 'Erro ao atualizar recorrência' });
  }
});

// Deletar recorrência
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM recorrencias WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recorrência não encontrada' });
    }

    res.json({ message: 'Recorrência deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar recorrência:', error);
    res.status(500).json({ error: 'Erro ao deletar recorrência' });
  }
});

// Listar compras parceladas
router.get('/parceladas', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.descricao, p.valor_total, p.num_parcelas, p.parcela_atual,
              p.valor_parcela, p.dia_vencimento, p.data_inicio, p.ativo, c.nome_caixinha
       FROM parceladas p
       LEFT JOIN caixinhas c ON p.caixinha_id = c.id
       WHERE p.user_id = $1
       ORDER BY p.data_inicio DESC`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar parceladas:', error);
    res.status(500).json({ error: 'Erro ao listar parceladas' });
  }
});

// Criar compra parcelada
router.post('/parceladas',
  authMiddleware,
  [
    body('descricao').trim().notEmpty(),
    body('valorTotal').isFloat({ min: 0.01 }),
    body('numParcelas').isInt({ min: 1 }),
    body('diaVencimento').isInt({ min: 1, max: 31 }),
    body('dataInicio').isDate()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { descricao, valorTotal, numParcelas, diaVencimento, dataInicio, caixinhaId } = req.body;
      const valorParcela = valorTotal / numParcelas;

      const result = await pool.query(
        `INSERT INTO parceladas (user_id, descricao, valor_total, num_parcelas, valor_parcela, 
                                 dia_vencimento, data_inicio, caixinha_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [req.userId, descricao, valorTotal, numParcelas, valorParcela, diaVencimento, dataInicio, caixinhaId || null]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar parcelada:', error);
      res.status(500).json({ error: 'Erro ao criar parcelada' });
    }
  }
);

// Deletar compra parcelada
router.delete('/parceladas/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM parceladas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Parcelada não encontrada' });
    }

    res.json({ message: 'Parcelada deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar parcelada:', error);
    res.status(500).json({ error: 'Erro ao deletar parcelada' });
  }
});

module.exports = router;
