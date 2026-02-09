# 🚀 Guia de Deploy Local - CashFlow Hub

Sistema de Controle Financeiro Self-Hosted com PostgreSQL

## 📋 Pré-requisitos

- Docker 20.10+ instalado
- Docker Compose 2.0+ instalado
- 4GB RAM disponível
- 10GB espaço em disco

### Instalação do Docker

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
- Baixe Docker Desktop: https://www.docker.com/products/docker-desktop

**Windows:**
- Baixe Docker Desktop: https://www.docker.com/products/docker-desktop

## 🎯 Deploy Rápido (Recomendado)

### Opção 1: Script Automatizado

```bash
# Torne o script executável
chmod +x deploy.sh

# Execute o deploy
./deploy.sh
```

O script irá:
1. Verificar se Docker está instalado
2. Parar containers antigos (se existirem)
3. Fazer build das imagens
4. Iniciar todos os serviços
5. Executar migrations automaticamente

### Opção 2: Manual

```bash
# 1. Build das imagens
docker compose build

# 2. Iniciar serviços
docker compose up -d

# 3. Verificar status
docker compose ps

# 4. Ver logs (opcional)
docker compose logs -f
```

## 🌐 Acessar o Sistema

Após o deploy, acesse:

- **Frontend (Interface):** http://localhost:3000
- **Backend API:** http://localhost:8001/api
- **PostgreSQL:** localhost:5432

### Primeiro Acesso

1. Abra http://localhost:3000
2. Clique em **"Cadastre-se"**
3. Preencha:
   - Nome
   - Email
   - Senha (mínimo 6 caracteres)
4. Faça login
5. Configure suas caixinhas na página "Caixinhas"

## 📊 Estrutura dos Serviços

```
┌─────────────────────────────────────┐
│  Frontend (React + Nginx)           │
│  Porta: 3000                        │
│  Container: financeiro-frontend     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Backend (Node.js + Express)        │
│  Porta: 8001                        │
│  Container: financeiro-backend      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  PostgreSQL 15                      │
│  Porta: 5432                        │
│  Container: financeiro-postgres     │
│  Volume: postgres_data (persistente)│
└─────────────────────────────────────┘
```

## 🔧 Comandos Úteis

### Gerenciamento

```bash
# Ver status dos containers
docker compose ps

# Ver logs de todos os serviços
docker compose logs -f

# Ver logs de um serviço específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres

# Reiniciar um serviço
docker compose restart backend
docker compose restart frontend

# Parar todos os serviços
docker compose down

# Parar e remover volumes (CUIDADO: apaga dados!)
docker compose down -v
```

### Backup e Restore

**Backup do Banco de Dados:**
```bash
# Criar backup
docker compose exec postgres pg_dump -U financeiro_user financeiro_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou com compressão
docker compose exec postgres pg_dump -U financeiro_user financeiro_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

**Restaurar Backup:**
```bash
# Restaurar de arquivo SQL
cat backup.sql | docker compose exec -T postgres psql -U financeiro_user -d financeiro_db

# Restaurar de arquivo comprimido
gunzip -c backup.sql.gz | docker compose exec -T postgres psql -U financeiro_user -d financeiro_db
```

### Manutenção

```bash
# Atualizar imagens
docker compose pull

# Rebuild completo (após mudanças no código)
docker compose down
docker compose build --no-cache
docker compose up -d

# Limpar recursos não utilizados
docker system prune -a
```

## 🔐 Segurança (Produção)

### Antes de colocar em produção, altere:

1. **Senhas do PostgreSQL** em `docker-compose.yml`:
```yaml
POSTGRES_PASSWORD: sua_senha_forte_aqui
```

2. **JWT Secret** em `docker-compose.yml`:
```yaml
JWT_SECRET: seu_jwt_secret_forte_com_32_caracteres_ou_mais
```

3. **CORS Origins** (se necessário):
```yaml
CORS_ORIGINS: https://seu-dominio.com,https://app.seu-dominio.com
```

### Recomendações de Segurança

- Use senhas fortes (mínimo 16 caracteres)
- Mantenha backups regulares
- Atualize as imagens regularmente
- Use HTTPS em produção (via reverse proxy)
- Não exponha porta do PostgreSQL (5432) publicamente
- Configure firewall no servidor

## 🌍 Expor na Internet (Opcional)

### Usando Nginx como Reverse Proxy

```nginx
# /etc/nginx/sites-available/cashflow

server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Certificado SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 📈 Monitoramento

### Uso de Recursos

```bash
# Ver uso de recursos dos containers
docker stats

# Espaço em disco dos volumes
docker system df

# Logs em tempo real
docker compose logs -f --tail=100
```

### Health Check

```bash
# Verificar se serviços estão respondendo
curl http://localhost:8001/api
curl http://localhost:3000

# Verificar PostgreSQL
docker compose exec postgres pg_isready -U financeiro_user
```

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :3000
sudo lsof -i :8001
sudo lsof -i :5432

# Matar processo
sudo kill -9 <PID>
```

### Container não inicia
```bash
# Ver logs detalhados
docker compose logs backend
docker compose logs postgres

# Verificar configuração
docker compose config
```

### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está pronto
docker compose exec postgres pg_isready

# Conectar manualmente ao banco
docker compose exec postgres psql -U financeiro_user -d financeiro_db

# Executar migrations manualmente
docker compose exec backend node database/migrate.js
```

### Reset completo
```bash
# CUIDADO: Isso apaga TODOS os dados!
docker compose down -v
docker compose up -d
```

## 📁 Estrutura de Arquivos

```
cashflow-hub/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuração PostgreSQL
│   ├── database/
│   │   ├── migrations.sql       # Migrations Fase 1
│   │   ├── migrations_fase2.sql # Migrations Fase 2
│   │   └── migrate.js          # Script de migration
│   ├── middleware/
│   │   └── auth.js             # Autenticação JWT
│   ├── routes/
│   │   ├── auth.js             # Autenticação
│   │   ├── caixinhas.js        # Motor de caixinhas
│   │   ├── transacoes.js       # Transações
│   │   ├── recorrencias.js     # Contas fixas/parceladas
│   │   ├── dividas.js          # Gestão de dívidas
│   │   ├── wishlist.js         # Wishlist
│   │   └── dashboards.js       # Relatórios/Gráficos
│   ├── .env                    # Variáveis de ambiente
│   ├── package.json            # Dependências Node.js
│   ├── server.js               # Servidor Express
│   └── Dockerfile              # Imagem Docker backend
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── context/            # Context API (Auth, Theme)
│   │   ├── lib/                # Utilitários (API client)
│   │   └── pages/              # Páginas da aplicação
│   ├── .env                    # Variáveis de ambiente
│   ├── package.json            # Dependências React
│   ├── Dockerfile              # Imagem Docker frontend
│   └── nginx.conf              # Configuração Nginx
├── docker-compose.yml          # Orquestração Docker
├── deploy.sh                   # Script de deploy
├── DEPLOY.md                   # Este arquivo
└── README.md                   # Documentação principal
```

## 💾 Migração de Dados

### Importar dados de outro sistema

1. Prepare arquivo SQL com inserts
2. Execute no container:
```bash
docker compose exec postgres psql -U financeiro_user -d financeiro_db < dados.sql
```

### Exportar dados
```bash
docker compose exec postgres pg_dump -U financeiro_user financeiro_db --data-only > dados.sql
```

## 🆘 Suporte

- Documentação completa: README.md
- Issues: Verifique logs com `docker compose logs`
- Comunidade: PostgreSQL, Node.js, React

## 📜 Licença

MIT License - Uso livre para fins pessoais e comerciais.

---

**Desenvolvido com ❤️ para controle financeiro pessoal**
