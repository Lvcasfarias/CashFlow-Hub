const express = require('express');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ========================
// CATEGORIAS
// ========================

// Listar categorias (sistema + usuário)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { tipo } = req.query;
    
    let query = `
      SELECT * FROM categorias 
      WHERE (user_id IS NULL OR user_id = $1)
    `;
    
    const params = [req.userId];
    
    if (tipo) {
      query += ' AND tipo = $2';
      params.push(tipo);
    }
    
    query += ' ORDER BY is_sistema DESC, nome ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ error: 'Erro ao listar categorias' });
  }
});

// Criar categoria personalizada
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { nome, tipo, icone, cor } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    const result = await pool.query(
      `INSERT INTO categorias (user_id, nome, tipo, icone, cor)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.userId, nome, tipo, icone || null, cor || '#6B7280']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

// Deletar categoria (apenas personalizadas)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM categorias WHERE id = $1 AND user_id = $2 AND is_sistema = false RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria não encontrada ou é do sistema' });
    }

    res.json({ message: 'Categoria deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar categoria:', error);
    res.status(500).json({ error: 'Erro ao deletar categoria' });
  }
});

module.exports = router;
