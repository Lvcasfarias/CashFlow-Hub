const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Listar caixinhas do mês atual
router.get('/', authMiddleware, async (req, res) => {
  try {
    const mesReferencia = req.query.mes || new Date().toISOString().slice(0, 7);
    
    const result = await pool.query(
      `SELECT id, nome_caixinha, porcentagem_alvo, valor_alocado, 
              valor_gasto, saldo_disponivel, mes_referencia
       FROM caixinhas 
       WHERE user_id = $1 AND mes_referencia = $2
       ORDER BY nome_caixinha`,
      [req.userId, mesReferencia]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar caixinhas:', error);
    res.status(500).json({ error: 'Erro ao listar caixinhas' });
  }
});

// Criar/Atualizar configuração de caixinhas
router.post('/configurar', authMiddleware, async (req, res) => {
  try {
    const { caixinhas, mesReferencia } = req.body;
    
    if (!Array.isArray(caixinhas) || caixinhas.length === 0) {
      return res.status(400).json({ error: 'Caixinhas inválidas' });
    }

    const mes = mesReferencia || new Date().toISOString().slice(0, 7);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const caixinha of caixinhas) {
        await client.query(
          `INSERT INTO caixinhas (user_id, nome_caixinha, porcentagem_alvo, mes_referencia, valor_alocado, valor_gasto, saldo_disponivel)
           VALUES ($1, $2, $3, $4, 0, 0, 0)
           ON CONFLICT (user_id, nome_caixinha, mes_referencia)
           DO UPDATE SET porcentagem_alvo = $3`,
          [req.userId, caixinha.nome, caixinha.porcentagem, mes]
        );
      }

      await client.query('COMMIT');

      const result = await pool.query(
        'SELECT * FROM caixinhas WHERE user_id = $1 AND mes_referencia = $2',
        [req.userId, mes]
      );

      res.json({ message: 'Caixinhas configuradas com sucesso', caixinhas: result.rows });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao configurar caixinhas:', error);
    res.status(500).json({ error: 'Erro ao configurar caixinhas' });
  }
});

// Distribuir entrada entre caixinhas
router.post('/distribuir', authMiddleware, async (req, res) => {
  try {
    const { valor, mesReferencia } = req.body;
    
    if (!valor || valor <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const mes = mesReferencia || new Date().toISOString().slice(0, 7);

    const caixinhasResult = await pool.query(
      'SELECT id, nome_caixinha, porcentagem_alvo, valor_alocado FROM caixinhas WHERE user_id = $1 AND mes_referencia = $2',
      [req.userId, mes]
    );

    if (caixinhasResult.rows.length === 0) {
      return res.status(400).json({ error: 'Configure as caixinhas primeiro' });
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

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

      await client.query('COMMIT');

      const updatedResult = await pool.query(
        'SELECT * FROM caixinhas WHERE user_id = $1 AND mes_referencia = $2',
        [req.userId, mes]
      );

      res.json({ message: 'Valor distribuído com sucesso', caixinhas: updatedResult.rows });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Erro ao distribuir valor:', error);
    res.status(500).json({ error: 'Erro ao distribuir valor' });
  }
});

module.exports = router;
