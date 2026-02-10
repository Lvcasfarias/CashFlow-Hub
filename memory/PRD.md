# CashFlow Hub - PRD (Product Requirements Document)

## Visao Geral
CashFlow Hub e um sistema de controle financeiro pessoal completo, projetado para self-hosting com Node.js, React e PostgreSQL.

## Stack Tecnologico
- **Backend:** Node.js + Express.js
- **Frontend:** React.js + Tailwind CSS + Shadcn/UI
- **Banco de Dados:** PostgreSQL
- **Autenticacao:** JWT
- **Graficos:** Recharts
- **Deploy:** Docker + Docker Compose

## Funcionalidades Implementadas

### Fase 1 - Core (Completo)
- [x] Sistema de autenticacao (login/registro)
- [x] Motor de Caixinhas com distribuicao automatica por porcentagem
- [x] Transacoes com vinculacao a caixinhas
- [x] Barras de progresso com alertas de cor (amarelo 80%, laranja 95%, vermelho >100%)
- [x] Saldo negativo visualmente indicado

### Fase 2 - Gestao Financeira (Completo)
- [x] Modulo de Recorrencias (contas fixas mensais)
- [x] Modulo de Compras Parceladas
- [x] Modulo de Dividas com amortizacao
- [x] Dashboards com Recharts (Fluxo de Caixa, Categorias, Projecao 6 meses)
- [x] Exportar para CSV

### Fase 3 - Inteligencia Financeira (Implementado - 16/12/2024)
- [x] **Modulo de Cartoes de Credito**
  - Cadastro com limite, dia fechamento/vencimento
  - Calculo de fatura atual e futura
  - Logica de melhor dia de compra
  - Pagamento de fatura
- [x] **Atributos de Transacao Expandidos**
  - Categoria (Alimentacao, Transporte, Lazer, etc)
  - Metodo de Pagamento (PIX, Cartao, Dinheiro, etc)
  - Conta de Origem
- [x] **Modulo de Metas (Goals)**
  - Definir valor alvo e data limite
  - Calculo automatico de aporte mensal necessario
  - Aportes com debito opcional de caixinha
  - Progresso visual com indicadores
- [x] **Wishlist Funcional**
  - Vinculacao a caixinhas
  - Aporte mensal planejado
  - Tempo estimado para compra
  - Marcar como comprado com debito automatico
- [x] **Saldo Consolidado no Dashboard**
  - Soma de todas as contas
  - Menos dividas e cartoes utilizados
  - Exibicao em destaque
- [x] **CRUD Completo**
  - Editar transacoes
  - Editar recorrencias
  - Editar parceladas

## Arquitetura do Sistema

### Backend (Node.js/Express)
```
/app/backend
├── server.js              # Servidor principal
├── config/database.js     # Conexao PostgreSQL
├── middleware/auth.js     # Autenticacao JWT
├── routes/
│   ├── auth.js           # Login/Registro
│   ├── caixinhas.js      # Motor de caixinhas
│   ├── transacoes.js     # CRUD transacoes
│   ├── recorrencias.js   # Contas fixas + parceladas
│   ├── dividas.js        # Gestao de dividas
│   ├── cartoes.js        # Cartoes de credito
│   ├── metas.js          # Metas financeiras
│   ├── wishlist.js       # Lista de desejos
│   ├── categorias.js     # Categorias de transacao
│   ├── contas.js         # Contas bancarias
│   └── dashboards.js     # Dados para graficos
└── database/
    ├── migrations.sql
    ├── migrations_fase2.sql
    └── migrations_fase3.sql
```

### Frontend (React)
```
/app/frontend/src
├── pages/
│   ├── LoginPage.js
│   ├── DashboardPage.js
│   ├── CaixinhasPage.js
│   ├── TransacoesPage.js
│   ├── RecorrenciasPage.js
│   ├── DividasPage.js
│   ├── CartoesPage.js      # NOVO
│   ├── MetasPage.js        # NOVO
│   ├── WishlistPage.js     # NOVO
│   └── RelatoriosPage.js
├── components/
│   ├── Layout.js
│   └── ui/                 # Shadcn components
└── context/
    ├── AuthContext.js
    └── ThemeContext.js
```

## Endpoints da API

### Autenticacao
- `POST /api/auth/register` - Criar conta
- `POST /api/auth/login` - Login

### Caixinhas
- `GET /api/caixinhas?mes=YYYY-MM` - Listar
- `POST /api/caixinhas/configurar` - Configurar caixinhas
- `POST /api/caixinhas/distribuir` - Distribuir entrada

### Transacoes
- `GET /api/transacoes` - Listar com filtros
- `POST /api/transacoes` - Criar
- `PUT /api/transacoes/:id` - Editar
- `DELETE /api/transacoes/:id` - Excluir
- `GET /api/transacoes/estatisticas` - Resumo do mes

### Cartoes (NOVO)
- `GET /api/cartoes` - Listar cartoes
- `POST /api/cartoes` - Criar cartao
- `PUT /api/cartoes/:id` - Editar
- `DELETE /api/cartoes/:id` - Excluir
- `GET /api/cartoes/:id/fatura-atual` - Fatura atual
- `GET /api/cartoes/:id/melhor-dia-compra` - Dica de melhor dia
- `GET /api/cartoes/resumo` - Resumo de todos cartoes

### Metas (NOVO)
- `GET /api/metas` - Listar metas
- `POST /api/metas` - Criar meta
- `PUT /api/metas/:id` - Editar
- `DELETE /api/metas/:id` - Excluir
- `POST /api/metas/:id/aportar` - Fazer aporte
- `GET /api/metas/:id/aportes` - Historico de aportes

### Dashboards
- `GET /api/dashboards/resumo-geral` - Resumo consolidado
- `GET /api/dashboards/fluxo-caixa` - Ultimos 6 meses
- `GET /api/dashboards/projecao-futura` - Proximos 6 meses

## Banco de Dados (PostgreSQL)

### Tabelas Principais
- `users` - Usuarios
- `caixinhas` - Categorias de orcamento
- `transacoes` - Movimentacoes
- `recorrencias` - Contas fixas
- `parceladas` - Compras parceladas
- `dividas` - Controle de dividas
- `amortizacoes` - Pagamentos de dividas
- `cartoes` - Cartoes de credito (NOVO)
- `faturas` - Faturas de cartao (NOVO)
- `metas` - Objetivos financeiros (NOVO)
- `aportes_metas` - Contribuicoes para metas (NOVO)
- `categorias` - Categorias de transacao (NOVO)
- `contas` - Contas bancarias (NOVO)
- `wishlist` - Lista de desejos

## Deploy (Self-Hosting)

### Pre-requisitos
- Docker e Docker Compose instalados
- PostgreSQL 15+

### Comandos
```bash
# Clonar repositorio
git clone <repo>
cd cashflow-hub

# Configurar variaveis
cp .env.example .env
# Editar .env com suas configuracoes

# Subir containers
docker-compose up -d

# Rodar migrations
docker exec -it backend psql -U financeiro_user -d financeiro_db -f /app/database/migrations.sql
docker exec -it backend psql -U financeiro_user -d financeiro_db -f /app/database/migrations_fase2.sql
docker exec -it backend psql -U financeiro_user -d financeiro_db -f /app/database/migrations_fase3.sql
```

## Proximas Tarefas (Backlog)

### P1 - Melhorias
- [ ] Filtro de periodo customizado nos relatorios
- [ ] Grafico de reducao de dividas ao longo do tempo
- [ ] Notificacoes de vencimento proximo

### P2 - Futuro
- [ ] App mobile (React Native)
- [ ] Importacao de extratos bancarios
- [ ] Integracao com Open Banking

## Credenciais de Teste
- Email: test@test.com
- Senha: password123
