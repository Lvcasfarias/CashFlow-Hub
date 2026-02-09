# ✅ Checklist de Produção - CashFlow Hub

Use este checklist antes de colocar o sistema em produção.

## 🔐 Segurança

- [ ] Alterar senha do PostgreSQL em `docker-compose.yml`
- [ ] Gerar novo JWT_SECRET forte (mínimo 32 caracteres)
- [ ] Configurar CORS_ORIGINS com domínios específicos
- [ ] Remover ou desabilitar usuários de teste
- [ ] Configurar firewall no servidor
- [ ] Não expor porta 5432 (PostgreSQL) publicamente
- [ ] Implementar rate limiting no backend (opcional)

## 🌐 Infraestrutura

- [ ] Servidor com no mínimo 4GB RAM
- [ ] Disco com no mínimo 20GB disponível
- [ ] Docker e Docker Compose instalados
- [ ] Domínio configurado (se aplicável)
- [ ] SSL/HTTPS configurado (Let's Encrypt recomendado)
- [ ] Reverse proxy configurado (Nginx/Traefik)

## 💾 Backup

- [ ] Configurar backups automáticos diários
- [ ] Testar processo de restore
- [ ] Definir local de armazenamento dos backups (externo ao servidor)
- [ ] Configurar retenção de backups (ex: 30 dias)
- [ ] Documentar procedimento de recuperação

**Script de backup automático disponível:** `./backup.sh`

**Cron para backup diário (2h da manhã):**
```bash
0 2 * * * cd /caminho/para/cashflow-hub && ./backup.sh >> /var/log/cashflow-backup.log 2>&1
```

## 📊 Monitoramento

- [ ] Configurar alertas de disco cheio
- [ ] Monitorar uso de memória/CPU
- [ ] Configurar logs centralizados (opcional)
- [ ] Testar notificações de erro
- [ ] Documentar procedimentos de troubleshooting

## 🧪 Testes

- [ ] Testar cadastro de novo usuário
- [ ] Testar configuração de caixinhas
- [ ] Testar cadastro de transações
- [ ] Testar recorrências (fixas e parceladas)
- [ ] Testar gestão de dívidas
- [ ] Testar relatórios e gráficos
- [ ] Testar exportação CSV
- [ ] Testar tema claro/escuro
- [ ] Testar em mobile

## 🔄 Atualização

- [ ] Documentar versão atual do sistema
- [ ] Criar procedimento de atualização
- [ ] Testar atualização em ambiente de teste primeiro
- [ ] Fazer backup antes de atualizar

## 📝 Documentação

- [ ] Documentar credenciais de acesso (em local seguro)
- [ ] Documentar configurações customizadas
- [ ] Criar runbook de operações comuns
- [ ] Documentar contatos de suporte (se aplicável)

## 🚀 Deploy

### Variáveis de Ambiente Críticas

**Backend (.env):**
```env
PORT=8001
DATABASE_URL=postgresql://usuario:SENHA_FORTE@postgres:5432/financeiro_db
JWT_SECRET=GERE_UM_SECRET_FORTE_AQUI_32_CARACTERES_OU_MAIS
CORS_ORIGINS=https://seu-dominio.com
NODE_ENV=production
```

**Docker Compose:**
```yaml
POSTGRES_PASSWORD: SENHA_FORTE_AQUI
JWT_SECRET: MESMO_DO_BACKEND
```

### Comandos de Deploy

```bash
# 1. Build
docker compose build --no-cache

# 2. Deploy
docker compose up -d

# 3. Verificar
docker compose ps
docker compose logs -f

# 4. Backup inicial
./backup.sh
```

## 🔧 Pós-Deploy

- [ ] Verificar todos os serviços estão UP
- [ ] Testar acesso pelo domínio
- [ ] Verificar SSL funcionando (HTTPS)
- [ ] Criar primeiro usuário admin
- [ ] Testar todas as funcionalidades principais
- [ ] Configurar backup automático
- [ ] Documentar versão deployed

## 📞 Suporte

**Em caso de problemas:**

1. Verificar logs: `docker compose logs -f`
2. Verificar status: `docker compose ps`
3. Verificar recursos: `docker stats`
4. Consultar DEPLOY.md para troubleshooting

## 📋 Informações do Sistema

**Versão:** 2.0 (Fase 2 Completa)

**Stack:**
- Frontend: React.js + Tailwind CSS + Recharts
- Backend: Node.js + Express
- Database: PostgreSQL 15
- Infraestrutura: Docker + Docker Compose

**Funcionalidades:**
- Motor de Caixinhas (Envelope Budgeting)
- Gestão de Transações
- Contas Fixas e Parceladas
- Gestão de Dívidas com Amortização
- Dashboards e Relatórios (Recharts)
- Exportação CSV
- Autenticação JWT
- Tema Claro/Escuro

---

**Data do Checklist:** ___/___/______

**Responsável:** ____________________

**Observações:**
