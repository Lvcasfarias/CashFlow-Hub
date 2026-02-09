-- Adicionar campos de projeção nas caixinhas
ALTER TABLE caixinhas ADD COLUMN IF NOT EXISTS saldo_projetado DECIMAL(12,2) DEFAULT 0;
ALTER TABLE caixinhas ADD COLUMN IF NOT EXISTS reservado_fixos DECIMAL(12,2) DEFAULT 0;

-- Tabela de dívidas
CREATE TABLE IF NOT EXISTS dividas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_original DECIMAL(12,2) NOT NULL,
    valor_atual DECIMAL(12,2) NOT NULL,
    juros_mensal DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'negociando', 'quitado')),
    data_inicio DATE NOT NULL,
    data_quitacao DATE,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de amortizações de dívidas
CREATE TABLE IF NOT EXISTS amortizacoes (
    id SERIAL PRIMARY KEY,
    divida_id INTEGER NOT NULL REFERENCES dividas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar campo para histórico de projeções
CREATE TABLE IF NOT EXISTS projecoes_mensais (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mes_referencia VARCHAR(7) NOT NULL,
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    entradas_previstas DECIMAL(12,2) DEFAULT 0,
    saidas_previstas DECIMAL(12,2) DEFAULT 0,
    saldo_projetado DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mes_referencia)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_dividas_user_status ON dividas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_amortizacoes_divida ON amortizacoes(divida_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_user_mes ON projecoes_mensais(user_id, mes_referencia);

-- Adicionar campo para marcar se recorrência foi processada no mês
ALTER TABLE recorrencias ADD COLUMN IF NOT EXISTS ultimo_mes_processado VARCHAR(7);

-- Adicionar campo para rastrear parcelas pagas
ALTER TABLE parceladas ADD COLUMN IF NOT EXISTS parcelas_pagas INTEGER DEFAULT 0;
