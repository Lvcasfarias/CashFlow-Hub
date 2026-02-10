const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ========================
// CARTÕES DE CRÉDITO
// ========================

// Listar cartões
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*,
              (SELECT COALESCE(SUM(valor), 0) FROM faturas f WHERE f.cartao_id = c.id AND f.status = 'aberta') as fatura_aberta
       FROM cartoes c
       WHERE c.user_id = $1 
       ORDER BY c.nome`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar cartões:', error);
    res.status(500).json({ error: 'Erro ao listar cartões' });
  }
});

// Criar cartão
router.post('/',
  authMiddleware,
  [
    body('nome').trim().notEmpty(),
    body('limite').isFloat({ min: 0 }),
    body('diaFechamento').isInt({ min: 1, max: 31 }),
    body('diaVencimento').isInt({ min: 1, max: 31 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { nome, bandeira, limite, diaFechamento, diaVencimento, cor } = req.body;

      const result = await pool.query(
        `INSERT INTO cartoes (user_id, nome, bandeira, limite, limite_disponivel, dia_fechamento, dia_vencimento, cor)
         VALUES ($1, $2, $3, $4, $4, $5, $6, $7)
         RETURNING *`,
        [req.userId, nome, bandeira || null, limite, diaFechamento, diaVencimento, cor || '#8B5CF6']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      res.status(500).json({ error: 'Erro ao criar cartão' });
    }
  }
);

// Atualizar cartão
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, bandeira, limite, diaFechamento, diaVencimento, cor, ativo } = req.body;

    const result = await pool.query(
      `UPDATE cartoes 
       SET nome = COALESCE($1, nome),
           bandeira = COALESCE($2, bandeira),
           limite = COALESCE($3, limite),
           dia_fechamento = COALESCE($4, dia_fechamento),
           dia_vencimento = COALESCE($5, dia_vencimento),
           cor = COALESCE($6, cor),
           ativo = COALESCE($7, ativo)
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [nome, bandeira, limite, diaFechamento, diaVencimento, cor, ativo, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar cartão:', error);
    res.status(500).json({ error: 'Erro ao atualizar cartão' });
  }
});

// Deletar cartão
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM cartoes WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    res.json({ message: 'Cartão deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar cartão:', error);
    res.status(500).json({ error: 'Erro ao deletar cartão' });
  }
});

// ========================
// FATURAS
// ========================

// Listar faturas de um cartão
router.get('/:cartaoId/faturas', authMiddleware, async (req, res) => {
  try {
    const { cartaoId } = req.params;

    // Verificar se cartão pertence ao usuário
    const cartaoCheck = await pool.query(
      'SELECT id FROM cartoes WHERE id = $1 AND user_id = $2',
      [cartaoId, req.userId]
    );

    if (cartaoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const result = await pool.query(
      `SELECT f.*,
              (SELECT COUNT(*) FROM transacoes t WHERE t.fatura_id = f.id) as num_transacoes
       FROM faturas f
       WHERE f.cartao_id = $1
       ORDER BY f.mes_referencia DESC`,
      [cartaoId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar faturas:', error);
    res.status(500).json({ error: 'Erro ao listar faturas' });
  }
});

// Obter fatura atual de um cartão
router.get('/:cartaoId/fatura-atual', authMiddleware, async (req, res) => {
  try {
    const { cartaoId } = req.params;

    // Verificar se cartão pertence ao usuário
    const cartaoResult = await pool.query(
      'SELECT * FROM cartoes WHERE id = $1 AND user_id = $2',
      [cartaoId, req.userId]
    );

    if (cartaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const cartao = cartaoResult.rows[0];
    const hoje = new Date();
    let mesReferencia;

    // Determinar mês da fatura atual baseado no dia de fechamento
    if (hoje.getDate() > cartao.dia_fechamento) {
      // Após fechamento, fatura é do próximo mês
      const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
      mesReferencia = proximoMes.toISOString().slice(0, 7);
    } else {
      mesReferencia = hoje.toISOString().slice(0, 7);
    }

    // Buscar ou criar fatura
    let faturaResult = await pool.query(
      'SELECT * FROM faturas WHERE cartao_id = $1 AND mes_referencia = $2',
      [cartaoId, mesReferencia]
    );

    if (faturaResult.rows.length === 0) {
      // Criar fatura
      const dataFechamento = new Date(hoje.getFullYear(), parseInt(mesReferencia.split('-')[1]) - 1, cartao.dia_fechamento);
      const dataVencimento = new Date(hoje.getFullYear(), parseInt(mesReferencia.split('-')[1]) - 1, cartao.dia_vencimento);

      faturaResult = await pool.query(
        `INSERT INTO faturas (cartao_id, mes_referencia, data_fechamento, data_vencimento)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [cartaoId, mesReferencia, dataFechamento, dataVencimento]
      );
    }

    // Buscar transações da fatura
    const transacoesResult = await pool.query(
      `SELECT t.*, c.nome as categoria_nome
       FROM transacoes t
       LEFT JOIN categorias c ON t.categoria_id = c.id
       WHERE t.fatura_id = $1
       ORDER BY t.data DESC`,
      [faturaResult.rows[0].id]
    );

    res.json({
      fatura: faturaResult.rows[0],
      transacoes: transacoesResult.rows,
      cartao: cartao
    });
  } catch (error) {
    console.error('Erro ao obter fatura atual:', error);
    res.status(500).json({ error: 'Erro ao obter fatura atual' });
  }
});

// Calcular melhor dia de compra
router.get('/:cartaoId/melhor-dia-compra', authMiddleware, async (req, res) => {
  try {
    const { cartaoId } = req.params;

    const cartaoResult = await pool.query(
      'SELECT * FROM cartoes WHERE id = $1 AND user_id = $2',
      [cartaoId, req.userId]
    );

    if (cartaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Cartão não encontrado' });
    }

    const cartao = cartaoResult.rows[0];
    const hoje = new Date();
    const diaAtual = hoje.getDate();
    
    // Melhor dia é logo após o fechamento
    const melhorDia = cartao.dia_fechamento + 1 > 28 ? 1 : cartao.dia_fechamento + 1;
    
    // Dias até o fechamento
    let diasAteFechamento;
    if (diaAtual <= cartao.dia_fechamento) {
      diasAteFechamento = cartao.dia_fechamento - diaAtual;
    } else {
      const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      diasAteFechamento = (ultimoDiaMes - diaAtual) + cartao.dia_fechamento;
    }

    // Calcular data de vencimento da próxima fatura
    let dataVencimentoProxima;
    if (diaAtual <= cartao.dia_fechamento) {
      dataVencimentoProxima = new Date(hoje.getFullYear(), hoje.getMonth(), cartao.dia_vencimento);
    } else {
      dataVencimentoProxima = new Date(hoje.getFullYear(), hoje.getMonth() + 1, cartao.dia_vencimento);
    }

    res.json({
      melhor_dia_compra: melhorDia,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento,
      dias_ate_fechamento: diasAteFechamento,
      data_vencimento_proxima: dataVencimentoProxima,
      dica: diasAteFechamento <= 5 
        ? 'Compras hoje entrarão na fatura atual. Considere aguardar após o fechamento para mais prazo.'
        : `Você tem ${diasAteFechamento} dias até o fechamento da fatura atual.`
    });
  } catch (error) {
    console.error('Erro ao calcular melhor dia:', error);
    res.status(500).json({ error: 'Erro ao calcular melhor dia de compra' });
  }
});

// Pagar fatura
router.post('/:cartaoId/faturas/:faturaId/pagar',
  authMiddleware,
  [
    body('valor').isFloat({ min: 0.01 }),
    body('contaId').isInt()
  ],
  async (req, res) => {
    try {
      const { cartaoId, faturaId } = req.params;
      const { valor, contaId, dataPagamento } = req.body;

      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Verificar fatura
        const faturaResult = await client.query(
          `SELECT f.*, c.user_id 
           FROM faturas f 
           JOIN cartoes c ON f.cartao_id = c.id
           WHERE f.id = $1 AND c.id = $2 AND c.user_id = $3`,
          [faturaId, cartaoId, req.userId]
        );

        if (faturaResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: 'Fatura não encontrada' });
        }

        const fatura = faturaResult.rows[0];

        // Atualizar fatura
        const novoValor = parseFloat(fatura.valor_total) - parseFloat(valor);
        const novoStatus = novoValor <= 0 ? 'paga' : 'aberta';

        await client.query(
          `UPDATE faturas 
           SET valor_total = $1, 
               status = $2,
               data_pagamento = CASE WHEN $2 = 'paga' THEN $3 ELSE data_pagamento END
           WHERE id = $4`,
          [Math.max(novoValor, 0), novoStatus, dataPagamento || new Date(), faturaId]
        );

        // Debitar da conta
        await client.query(
          `UPDATE contas SET saldo_atual = saldo_atual - $1 WHERE id = $2`,
          [valor, contaId]
        );

        // Liberar limite do cartão
        await client.query(
          `UPDATE cartoes SET limite_disponivel = limite_disponivel + $1 WHERE id = $2`,
          [valor, cartaoId]
        );

        await client.query('COMMIT');

        res.json({ message: 'Pagamento registrado com sucesso', novo_status: novoStatus });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Erro ao pagar fatura:', error);
      res.status(500).json({ error: 'Erro ao pagar fatura' });
    }
  }
);

// Resumo de todos os cartões
router.get('/resumo', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
         COALESCE(SUM(limite), 0) as limite_total,
         COALESCE(SUM(limite_disponivel), 0) as limite_disponivel_total,
         COALESCE(SUM(limite - limite_disponivel), 0) as total_utilizado,
         COUNT(*) as total_cartoes
       FROM cartoes
       WHERE user_id = $1 AND ativo = true`,
      [req.userId]
    );

    // Buscar faturas abertas
    const faturasResult = await pool.query(
      `SELECT COALESCE(SUM(f.valor_total), 0) as total_faturas_abertas
       FROM faturas f
       JOIN cartoes c ON f.cartao_id = c.id
       WHERE c.user_id = $1 AND f.status = 'aberta'`,
      [req.userId]
    );

    res.json({
      ...result.rows[0],
      total_faturas_abertas: faturasResult.rows[0].total_faturas_abertas
    });
  } catch (error) {
    console.error('Erro ao obter resumo de cartões:', error);
    res.status(500).json({ error: 'Erro ao obter resumo de cartões' });
  }
});

module.exports = router;
