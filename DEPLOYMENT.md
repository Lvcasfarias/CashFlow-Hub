# CashFlow Hub - Guia de Deploy

## Pre-requisitos

- Docker e Docker Compose instalados
- Porta 3000 (frontend), 8001 (backend) e 5432 (postgres) livres

## Deploy Rapido

```bash
# 1. Clonar/Copiar os arquivos para o servidor

# 2. Dar permissao ao script
chmod +x deploy.sh

# 3. Definir o IP do seu servidor (opcional, padrao: 192.168.1.51)
export SERVER_IP=192.168.1.51

# 4. Executar o deploy
./deploy.sh
```

## Deploy Manual

```bash
# Definir IP do servidor
export REACT_APP_BACKEND_URL=http://192.168.1.51:8001

# Parar containers existentes
docker-compose down

# Construir e iniciar
docker-compose up --build -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

## Acessar a Aplicacao

- **Frontend:** http://192.168.1.51:3000
- **Backend API:** http://192.168.1.51:8001/api
- **Teste API:** http://192.168.1.51:8001/api

## Criar Primeiro Usuario

1. Acesse http://192.168.1.51:3000
2. Clique em "Criar Conta"
3. Preencha: Nome, Email, Senha (minimo 6 caracteres)
4. Pronto! Voce sera redirecionado ao Dashboard

## Estrutura do Banco

O banco de dados e criado automaticamente na primeira execucao.
As tabelas incluem:

- `users` - Usuarios
- `caixinhas` - Categorias de orcamento
- `transacoes` - Movimentacoes financeiras
- `recorrencias` - Contas fixas mensais
- `parceladas` - Compras parceladas
- `dividas` - Controle de dividas
- `cartoes` - Cartoes de credito
- `faturas` - Faturas dos cartoes
- `metas` - Objetivos financeiros
- `categorias` - Categorias de transacoes
- `contas` - Contas bancarias
- `wishlist` - Lista de desejos

## Solucao de Problemas

### Erro de Conexao com Banco
```bash
# Verificar se postgres esta rodando
docker-compose logs postgres

# Recriar banco (CUIDADO: apaga dados!)
docker-compose down -v
docker-compose up --build -d
```

### Frontend nao conecta ao Backend
```bash
# Verificar se a URL esta correta
# O frontend precisa ser reconstruido com o IP correto:
export REACT_APP_BACKEND_URL=http://SEU_IP:8001
docker-compose up --build -d frontend
```

### Verificar Logs
```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Postgres
docker-compose logs -f postgres
```

## Backup do Banco

```bash
# Criar backup
docker exec financeiro-postgres pg_dump -U financeiro_user financeiro_db > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20241216.sql | docker exec -i financeiro-postgres psql -U financeiro_user financeiro_db
```
