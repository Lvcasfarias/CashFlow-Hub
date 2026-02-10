# CashFlow Hub - PRD

## Stack
- Backend: Node.js + Express + PostgreSQL
- Frontend: React + Tailwind + Shadcn/UI

## Correcoes Implementadas (Sessao Atual)

### 1. Persistencia do Saldo
- Criado `BalanceContext.js` para gerenciar saldo globalmente
- Saldo Consolidado exibido no sidebar (desktop) e header (mobile)
- Saldo persiste ao navegar entre paginas

### 2. Transacoes - Fix Completo
- Tratamento de erros com `.catch()` em todas as chamadas
- Campos de Categoria e Metodo de Pagamento adicionados
- Funcao de Editar implementada
- Exportar CSV funcional

### 3. Delecao de Caixinhas
- Implementado DELETE `/api/caixinhas/:id`
- Transacoes vinculadas sao desvinculadas (SET NULL)
- Confirmacao antes de excluir

### 4. Metas - Fix Tela Preta
- Tratamento de dados antes de renderizar
- Valores default para evitar crash
- Todas as chamadas API com `.catch()`

### 5. Relatorios Flexiveis
- Removida trava de 6 meses
- Seletor de periodo: 3, 6, 12, 24 meses
- Filtro por data inicio/fim customizada
- Backend atualizado para aceitar parametros dinamicos

### 6. Wishlist Funcional
- CRUD completo implementado
- Vinculacao a caixinhas
- Aporte mensal para calcular tempo de compra
- Marcar como comprado com debito automatico

## Arquitetura de Arquivos

```
frontend/src/
├── context/
│   ├── AuthContext.js
│   ├── ThemeContext.js
│   └── BalanceContext.js  # NOVO
├── components/
│   └── Layout.js  # Atualizado com saldo persistente
└── pages/
    ├── TransacoesPage.js  # Corrigido
    ├── MetasPage.js       # Corrigido
    ├── RelatoriosPage.js  # Corrigido
    ├── WishlistPage.js    # Implementado
    └── CaixinhasPage.js   # Atualizado

backend/routes/
├── dashboards.js   # Periodo flexivel
├── caixinhas.js    # DELETE implementado
├── transacoes.js   # PUT implementado
├── metas.js        # CRUD completo
└── wishlist.js     # CRUD completo
```

## Deploy

```bash
# No servidor 192.168.1.51
export REACT_APP_BACKEND_URL=http://192.168.1.51:8001
docker-compose up --build -d
```

## Credenciais de Teste
- Email: test@test.com
- Senha: password123
