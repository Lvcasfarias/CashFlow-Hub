#!/bin/bash

# Script de Backup Automático - CashFlow Hub
# Cria backup completo do banco de dados PostgreSQL

set -e

# Configurações
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cashflow_backup_${DATE}.sql.gz"

echo "🔄 CashFlow Hub - Backup Automático"
echo "===================================="
echo ""

# Criar diretório de backup se não existir
mkdir -p "$BACKUP_DIR"

# Verificar se container está rodando
if ! docker compose ps | grep -q "financeiro-postgres.*Up"; then
    echo "❌ Container PostgreSQL não está rodando!"
    echo "   Execute: docker compose up -d"
    exit 1
fi

echo "📦 Criando backup do banco de dados..."

# Criar backup comprimido
docker compose exec -T postgres pg_dump -U financeiro_user financeiro_db | gzip > "${BACKUP_DIR}/${BACKUP_FILE}"

# Verificar se backup foi criado
if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
    echo "✅ Backup criado com sucesso!"
    echo "   Arquivo: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo "   Tamanho: ${SIZE}"
else
    echo "❌ Erro ao criar backup!"
    exit 1
fi

# Limpar backups antigos (manter últimos 7 dias)
echo ""
echo "🧹 Limpando backups antigos (mantendo últimos 7 dias)..."
find "$BACKUP_DIR" -name "cashflow_backup_*.sql.gz" -type f -mtime +7 -delete

# Listar backups disponíveis
echo ""
echo "📋 Backups disponíveis:"
ls -lh "$BACKUP_DIR" | grep "cashflow_backup"

echo ""
echo "===================================="
echo "✅ Processo de backup concluído!"
echo ""
echo "💡 Para restaurar este backup:"
echo "   gunzip -c ${BACKUP_DIR}/${BACKUP_FILE} | docker compose exec -T postgres psql -U financeiro_user -d financeiro_db"
echo ""
