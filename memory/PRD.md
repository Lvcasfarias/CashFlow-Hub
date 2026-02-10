# CashFlow Hub - PRD (Product Requirements Document)

## Visao Geral
Sistema de controle financeiro pessoal inteligente para self-hosting.

**Stack:** Node.js + Express + PostgreSQL + React

## Funcionalidades Implementadas

### Core (Fase 1)
- [x] Autenticacao JWT (login/registro)
- [x] Motor de Caixinhas com distribuicao automatica por %
- [x] Transacoes vinculadas a caixinhas
- [x] Barras de progresso com alertas de cor (80% amarelo, 95% laranja, >100% vermelho)
- [x] Saldo negativo indicado visualmente

### Gestao Financeira (Fase 2)
- [x] Recorrencias (contas fixas mensais)
- [x] Compras parceladas
- [x] Controle de dividas com amortizacao
- [x] Dashboards com Recharts
- [x] Exportar para CSV

### Inteligencia Financeira (Fase 3) - 16/12/2024
- [x] **Modulo de Cartoes de Credito**
  - Cadastro: Nome, Limite, Dia Fechamento/Vencimento
  - Calculo de fatura atual e futura
  - Melhor dia de compra
  - Pagamento de fatura com debito de conta
- [x] **Atributos de Transacao Expandidos**
  - Categoria (Alimentacao, Transporte, Lazer, etc)
  - Metodo de Pagamento (PIX, Cartao, Dinheiro, etc)
  - Conta de Origem
- [x] **Modulo de Metas (Goals)**
  - Valor alvo e data limite
  - Calculo automatico de aporte mensal necessario
  - Aportes com debito de caixinha
  - Progresso visual
- [x] **Wishlist Funcional**
  - Vinculacao a caixinhas
  - Aporte mensal planejado
  - Tempo estimado para compra
  - Marcar como comprado
- [x] **Saldo Consolidado no Dashboard**
  - Contas + Caixinhas - Dividas - Cartoes
- [x] **CRUD Completo com Edicao**
  - Editar transacoes
  - Editar recorrencias
  - Editar parceladas
- [x] **Dashboard Resiliente**
  - Tratamento de dados vazios
  - COALESCE em todas as queries

## Arquitetura

### Backend
```
/app/backend
├── server.js
├── config/database.js
├── middleware/auth.js
├── routes/
│   ├── auth.js
│   ├── caixinhas.js
│   ├── transacoes.js
│   ├── recorrencias.js
│   ├── dividas.js
│   ├── cartoes.js
│   ├── metas.js
│   ├── categorias.js
│   ├── contas.js
│   ├── wishlist.js
│   └── dashboards.js
└── database/
    └── init.sql (migrations completas)
```

### Frontend
```
/app/frontend/src
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── CaixinhasPage.js
│   ├── TransacoesPage.js
│   ├── RecorrenciasPage.js
│   ├── DividasPage.js
│   ├── CartoesPage.js
│   ├── MetasPage.js
│   ├── WishlistPage.js
│   └── RelatoriosPage.js
├── components/Layout.js
└── context/
```

## Deploy

```bash
# No servidor (192.168.1.51)
export SERVER_IP=192.168.1.51
./deploy.sh

# Ou manualmente:
export REACT_APP_BACKEND_URL=http://192.168.1.51:8001
docker-compose up --build -d
```

## Endpoints API

### Auth
- POST /api/auth/register
- POST /api/auth/login

### Transacoes
- GET/POST /api/transacoes
- PUT/DELETE /api/transacoes/:id
- GET /api/transacoes/estatisticas

### Cartoes
- GET/POST /api/cartoes
- PUT/DELETE /api/cartoes/:id
- GET /api/cartoes/:id/fatura-atual
- GET /api/cartoes/:id/melhor-dia-compra
- GET /api/cartoes/resumo

### Metas
- GET/POST /api/metas
- PUT/DELETE /api/metas/:id
- POST /api/metas/:id/aportar
- GET /api/metas/estatisticas/resumo

### Dashboards
- GET /api/dashboards/resumo-geral
- GET /api/dashboards/fluxo-caixa
- GET /api/dashboards/projecao-futura

## Proximas Tarefas

### P1
- [ ] Filtros de periodo customizado nos relatorios
- [ ] Grafico de evolucao de reducao de dividas

### P2
- [ ] Notificacoes de vencimento
- [ ] App mobile
