const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ========================
// CONTAS BANCÁRIAS
// ========================

// Listar contas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM contas WHERE user_id = $1 ORDER BY nome`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar contas:', error);
    res.status(500).json({ error: 'Erro ao listar contas' });
  }
});

// Criar conta
router.post('/',
  authMiddleware,
  [
    body('nome').trim().notEmpty(),
    body('tipo').isIn(['corrente', 'poupanca', 'investimento', 'carteira']),
    body('saldoInicial').optional().isFloat()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, tipo, saldoInicial, cor } = req.body;
      const saldo = saldoInicial || 0;

      const result = await pool.query(
        `INSERT INTO contas (user_id, nome, tipo, saldo_inicial, saldo_atual, cor)
         VALUES ($1, $2, $3, $4, $4, $5)
         RETURNING *`,
        [req.userId, nome, tipo, saldo, cor || '#3B82F6']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      res.status(500).json({ error: 'Erro ao criar conta' });
    }
  }
);

// Atualizar conta
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, cor, ativo } = req.body;

    const result = await pool.query(
      `UPDATE contas 
       SET nome = COALESCE($1, nome),
           tipo = COALESCE($2, tipo),
           cor = COALESCE($3, cor),
           ativo = COALESCE($4, ativo)
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [nome, tipo, cor, ativo, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar conta:', error);
    res.status(500).json({ error: 'Erro ao atualizar conta' });
  }
});

// Deletar conta
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM contas WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conta não encontrada' });
    }

    res.json({ message: 'Conta deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar conta:', error);
    res.status(500).json({ error: 'Erro ao deletar conta' });
  }
});

// Saldo consolidado de todas as contas
router.get('/saldo-total', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         COALESCE(SUM(saldo_atual), 0) as saldo_total,
         COUNT(*) as total_contas
       FROM contas
       WHERE user_id = $1 AND ativo = true`,
      [req.userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao obter saldo total:', error);
    res.status(500).json({ error: 'Erro ao obter saldo total' });
  }
});

module.exports = router;
