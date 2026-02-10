-- =====================================================
-- CASHFLOW HUB - MIGRATIONS COMPLETAS
-- Execute este arquivo para criar todas as tabelas
-- =====================================================

-- Tabela de usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de caixinhas (categorias de orcamento)
CREATE TABLE IF NOT EXISTS caixinhas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome_caixinha VARCHAR(255) NOT NULL,
    porcentagem_alvo DECIMAL(5,2) NOT NULL,
    valor_alocado DECIMAL(12,2) DEFAULT 0,
    valor_gasto DECIMAL(12,2) DEFAULT 0,
    saldo_disponivel DECIMAL(12,2) DEFAULT 0,
    saldo_projetado DECIMAL(12,2) DEFAULT 0,
    reservado_fixos DECIMAL(12,2) DEFAULT 0,
    mes_referencia VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, nome_caixinha, mes_referencia)
);

-- Tabela de transacoes
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL,
    descricao TEXT,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    categoria_id INTEGER,
    metodo_pagamento VARCHAR(50) DEFAULT 'dinheiro',
    conta_id INTEGER,
    cartao_id INTEGER,
    fatura_id INTEGER,
    parcela_numero INTEGER,
    total_parcelas INTEGER,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recorrencias (contas fixas)
CREATE TABLE IF NOT EXISTS recorrencias (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL,
    descricao TEXT NOT NULL,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    frequencia VARCHAR(20) NOT NULL DEFAULT 'mensal',
    ativo BOOLEAN DEFAULT true,
    ultimo_mes_processado VARCHAR(7),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de compras parceladas
CREATE TABLE IF NOT EXISTS parceladas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    num_parcelas INTEGER NOT NULL,
    parcela_atual INTEGER DEFAULT 1,
    parcelas_pagas INTEGER DEFAULT 0,
    valor_parcela DECIMAL(12,2) NOT NULL,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    data_inicio DATE NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de wishlist
CREATE TABLE IF NOT EXISTS wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item VARCHAR(255) NOT NULL,
    valor_estimado DECIMAL(12,2) NOT NULL,
    necessidade INTEGER NOT NULL CHECK (necessidade BETWEEN 1 AND 5),
    desejo INTEGER NOT NULL CHECK (desejo BETWEEN 1 AND 5),
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    aporte_mensal DECIMAL(12,2) DEFAULT 0,
    data_prevista DATE,
    status VARCHAR(20) DEFAULT 'desejando' CHECK (status IN ('desejando', 'poupando', 'comprado', 'cancelado')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de dividas
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

-- Tabela de amortizacoes de dividas
CREATE TABLE IF NOT EXISTS amortizacoes (
    id SERIAL PRIMARY KEY,
    divida_id INTEGER NOT NULL REFERENCES dividas(id) ON DELETE CASCADE,
    valor DECIMAL(12,2) NOT NULL,
    data_pagamento DATE NOT NULL,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de projecoes mensais
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

-- Tabela de Contas Bancarias
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

-- Tabela de Cartoes de Credito
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

-- Tabela de Faturas de Cartao
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

-- Tabela de Categorias de Transacoes
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

-- Inserir categorias padrao do sistema
INSERT INTO categorias (nome, tipo, icone, cor, is_sistema) VALUES
    ('Salario', 'entrada', 'Briefcase', '#10B981', true),
    ('Freelance', 'entrada', 'Laptop', '#3B82F6', true),
    ('Investimentos', 'entrada', 'TrendingUp', '#8B5CF6', true),
    ('Outros', 'entrada', 'Plus', '#6B7280', true),
    ('Alimentacao', 'saida', 'Utensils', '#EF4444', true),
    ('Transporte', 'saida', 'Car', '#F59E0B', true),
    ('Moradia', 'saida', 'Home', '#3B82F6', true),
    ('Saude', 'saida', 'Heart', '#EC4899', true),
    ('Educacao', 'saida', 'GraduationCap', '#8B5CF6', true),
    ('Lazer', 'saida', 'Gamepad2', '#10B981', true),
    ('Compras', 'saida', 'ShoppingBag', '#F97316', true),
    ('Servicos', 'saida', 'Wrench', '#6366F1', true),
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

-- Adicionar foreign keys na tabela transacoes
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_categoria_id_fkey;
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_conta_id_fkey;
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_cartao_id_fkey;
ALTER TABLE transacoes DROP CONSTRAINT IF EXISTS transacoes_fatura_id_fkey;

ALTER TABLE transacoes ADD CONSTRAINT transacoes_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_conta_id_fkey FOREIGN KEY (conta_id) REFERENCES contas(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_cartao_id_fkey FOREIGN KEY (cartao_id) REFERENCES cartoes(id) ON DELETE SET NULL;
ALTER TABLE transacoes ADD CONSTRAINT transacoes_fatura_id_fkey FOREIGN KEY (fatura_id) REFERENCES faturas(id) ON DELETE SET NULL;

-- Indices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user_data ON transacoes(user_id, data);
CREATE INDEX IF NOT EXISTS idx_caixinhas_user_mes ON caixinhas(user_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_recorrencias_user ON recorrencias(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_parceladas_user ON parceladas(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_dividas_user_status ON dividas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_amortizacoes_divida ON amortizacoes(divida_id);
CREATE INDEX IF NOT EXISTS idx_projecoes_user_mes ON projecoes_mensais(user_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_cartoes_user ON cartoes(user_id);
CREATE INDEX IF NOT EXISTS idx_faturas_cartao_mes ON faturas(cartao_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_metas_user_status ON metas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao ON transacoes(cartao_id);
CREATE INDEX IF NOT EXISTS idx_contas_user ON contas(user_id);
