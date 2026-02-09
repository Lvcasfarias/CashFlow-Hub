# Sistema de Controle Financeiro - CashFlow Hub

Sistema self-hosted de controle financeiro pessoal com o método de caixinhas (envelope budgeting).

## Características

- **Motor de Caixinhas**: Distribua automaticamente sua renda em categorias (investimentos, custos, conhecimento, etc.)
- **Gestão de Transações**: Controle completo de entradas e saídas vinculadas às caixinhas
- **Recorrências**: Cadastro de contas fixas e compras parceladas
- **Wishlist**: Priorize seus desejos e veja quanto tempo falta para comprá-los
- **Dashboards**: Visualize sua situação financeira atual e futura
- **100% Self-Hosted**: Seus dados ficam no seu servidor

## Stack Tecnológica

- **Frontend**: React.js com Tailwind CSS
- **Backend**: Node.js com Express
- **Banco de Dados**: PostgreSQL
- **Infraestrutura**: Docker e Docker Compose

## Requisitos

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM mínimo
- 5GB espaço em disco

## Instalação

### 1. Clone o repositório

```bash
git clone <seu-repositorio>
cd financeiro-app
```

### 2. Configure as variáveis de ambiente

Edite o arquivo `docker-compose.yml` e altere:
- `JWT_SECRET`: Coloque um secret forte e único
- `POSTGRES_PASSWORD`: Altere a senha do banco de dados

### 3. Inicie os containers

```bash
docker-compose up -d
```

O Docker irá:
1. Baixar as imagens necessárias
2. Construir os containers do frontend e backend
3. Criar o banco de dados PostgreSQL
4. Executar as migrations automaticamente
5. Iniciar todos os serviços

### 4. Acesse a aplicação

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001/api

## Uso

### Primeiro Acesso

1. Acesse http://localhost:3000
2. Clique em "Cadastre-se"
3. Crie sua conta

### Configurar Caixinhas

1. Vá para a página "Caixinhas"
2. Clique em "Configurar"
3. Defina suas categorias e porcentagens (total deve ser 100%)
   - Exemplo: Investimentos (30%), Conhecimento (15%), Custos (55%)
4. Salve a configuração

### Distribuir Entrada

1. Na página "Caixinhas", clique em "Distribuir Entrada"
2. Digite o valor da entrada (ex: seu salário)
3. O sistema distribuirá automaticamente entre as caixinhas

### Cadastrar Saída

1. Vá para "Transações"
2. Clique em "Nova Transação"
3. Selecione "Saída"
4. **Importante**: Escolha qual caixinha será debitada
5. O saldo da caixinha será atualizado automaticamente

## Estrutura do Projeto

```
.
├── backend/
│   ├── config/          # Configurações (database)
│   ├── database/        # Migrations SQL
│   ├── middleware/      # Middlewares (auth)
│   ├── routes/          # Rotas da API
│   ├── server.js        # Servidor Express
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── context/     # Context API (Auth, Theme)
│   │   ├── lib/         # Utilitários (axios)
│   │   └── pages/       # Páginas da aplicação
│   ├── package.json
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml
```

## Comandos Úteis

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Parar os serviços

```bash
docker-compose down
```

### Parar e remover volumes (CUIDADO: apaga dados)

```bash
docker-compose down -v
```

### Rebuild dos containers

```bash
docker-compose up -d --build
```

### Acessar o banco de dados

```bash
docker-compose exec postgres psql -U financeiro_user -d financeiro_db
```

## Backup

### Backup do banco de dados

```bash
docker-compose exec postgres pg_dump -U financeiro_user financeiro_db > backup.sql
```

### Restaurar backup

```bash
cat backup.sql | docker-compose exec -T postgres psql -U financeiro_user -d financeiro_db
```

## Desenvolvimento

### Modo desenvolvimento (sem Docker)

#### Backend

```bash
cd backend
npm install
cp .env.example .env  # Configure as variáveis
node database/migrate.js
npm run dev
```

#### Frontend

```bash
cd frontend
yarn install
yarn start
```

## Segurança

### Recomendações para Produção:

1. **Altere as senhas padrão** no `docker-compose.yml`
2. **Use HTTPS** com certificado SSL (pode usar nginx-proxy + Let's Encrypt)
3. **Configure firewall** para expor apenas portas necessárias
4. **Faça backups regulares** do banco de dados
5. **Atualize as imagens** regularmente: `docker-compose pull && docker-compose up -d`

## Licença

MIT License

## Suporte

Para dúvidas e sugestões, abra uma issue no repositório.
