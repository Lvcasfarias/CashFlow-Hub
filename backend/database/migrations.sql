-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de caixinhas (categorias de orçamento)
CREATE TABLE IF NOT EXISTS caixinhas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nome_caixinha VARCHAR(255) NOT NULL,
    porcentagem_alvo DECIMAL(5,2) NOT NULL,
    valor_alocado DECIMAL(12,2) DEFAULT 0,
    valor_gasto DECIMAL(12,2) DEFAULT 0,
    saldo_disponivel DECIMAL(12,2) DEFAULT 0,
    mes_referencia VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, nome_caixinha, mes_referencia)
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transacoes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('entrada', 'saida')),
    valor DECIMAL(12,2) NOT NULL,
    descricao TEXT,
    caixinha_id INTEGER REFERENCES caixinhas(id) ON DELETE SET NULL,
    data DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recorrências (contas fixas)
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user_data ON transacoes(user_id, data);
CREATE INDEX IF NOT EXISTS idx_caixinhas_user_mes ON caixinhas(user_id, mes_referencia);
CREATE INDEX IF NOT EXISTS idx_recorrencias_user ON recorrencias(user_id, ativo);
CREATE INDEX IF NOT EXISTS idx_parceladas_user ON parceladas(user_id, ativo);
