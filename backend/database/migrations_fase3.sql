-- =====================================================
-- MIGRATIONS FASE 3 - CASHFLOW HUB
-- Novas funcionalidades: Cartões, Metas, Categorias
-- =====================================================

-- Tabela de Contas Bancárias
CREATE TABLE IF NOT EXISTS contas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'corrente' CHECK (tipo IN ('corrente', 'poupanca', 'investimento', 'carteira')),
    saldo_inicial DECIMAL(12,2) DEFAULT 0,
    saldo_atual DECIMAL(12,2) DEFAULT 0,
    cor VARCHAR(7) DEFAULT '#3B82F6',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Cartões de Crédito
CREATE TABLE IF NOT EXISTS cartoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    bandeira VARCHAR(50),
    limite DECIMAL(12,2) NOT NULL,
    limite_disponivel DECIMAL(12,2) NOT NULL,
    dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    cor VARCHAR(7) DEFAULT '#8B5CF6',
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Faturas de Cartão
CREATE TABLE IF NOT EXISTS faturas (
    id SERIAL PRIMARY KEY,
    cartao_id INTEGER NOT NULL REFERENCES cartoes(id) ON DELETE CASCADE,
    mes_referencia VARCHAR(7) NOT NULL,
    valor_total DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'paga')),
    data_fechamento DATE,
    data_vencimento DATE,
    data_pagamento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cartao_id, mes_referencia)
);

-- Tabela de Categorias de Transações
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    icone VARCHAR(50),
    cor VARCHAR(7) DEFAULT '#6B7280',
    is_sistema BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir categorias padrão do sistema
INSERT INTO categorias (nome, tipo, icone, cor, is_sistema) VALUES
    ('Salário', 'entrada', 'Briefcase', '#10B981', true),
    ('Freelance', 'entrada', 'Laptop', '#3B82F6', true),
    ('Investimentos', 'entrada', 'TrendingUp', '#8B5CF6', true),
    ('Outros', 'entrada', 'Plus', '#6B7280', true),
    ('Alimentação', 'saida', 'Utensils', '#EF4444', true),
    ('Transporte', 'saida', 'Car', '#F59E0B', true),
    ('Moradia', 'saida', 'Home', '#3B82F6', true),
    ('Saúde', 'saida', 'Heart', '#EC4899', true),
    ('Educação', 'saida', 'GraduationCap', '#8B5CF6', true),
    ('Lazer', 'saida', 'Gamepad2', '#10B981', true),
    ('Compras', 'saida', 'ShoppingBag', '#F97316', true),
    ('Serviços', 'saida', 'Wrench', '#6366F1', true),
    ('Outros', 'saida', 'MoreHorizontal', '#6B7280', true)
ON CONFLICT DO NOTHING;

-- Tabela de Metas (Goals)
CREATE TABLE IF NOT EXISTS metas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    valor_alvo DECIMAL(12,2) NOT NULL,
    valor_atual DECIMAL(12,2) DEFAULT 0,
    data_limite DATE,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    prioridade INTEGER DEFAULT 1 CHECK (prioridade BETWEEN 1 AND 5),
    status VARCHAR(20) DEFAULT 'ativa' CHECK (status IN ('ativa', 'pausada', 'concluida', 'cancelada')),
    cor VARCHAR(7) DEFAULT '#10B981',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Aportes nas Metas
CREATE TABLE IF NOT EXISTS aportes_metas (
    id SERIAL PRIMARY KEY,
    meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2) NOT NULL,
    data_aporte DATE NOT NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar novos campos na tabela de transações
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS metodo_pagamento VARCHAR(50) DEFAULT 'dinheiro' CHECK (metodo_pagamento IN ('dinheiro', 'pix', 'cartao_debito', 'cartao_credito', 'transferencia', 'boleto'));
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS conta_id INTEGER REFERENCES contas(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS cartao_id INTEGER REFERENCES cartoes(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS fatura_id INTEGER REFERENCES faturas(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS parcela_numero INTEGER;
ALTER TABLE transacoes ADD COLUMN IF NOT EXISTS total_parcelas INTEGER;

-- Adicionar campo de caixinha na wishlist para vinculação
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS aporte_mensal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS data_prevista DATE;
ALTER TABLE wishlist ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'desejando' CHECK (status IN ('desejando', 'poupando', 'comprado', 'cancelado'));

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cartao_mes ON faturas(cartao_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_metas_user_status ON metas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao ON transacoes(cartao_id);
CREATE INDEX IF NOT EXISTS idx_contas_user ON contas(user_id);
