#!/bin/bash
# =====================================================
# CASHFLOW HUB - Script de Deploy
# Execute: chmod +x deploy.sh && ./deploy.sh
# =====================================================

set -e

echo "================================================="
echo " CashFlow Hub - Deploy Script"
echo "================================================="

# Verificar se Docker esta instalado
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker nao esta instalado!"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "ERRO: Docker Compose nao esta instalado!"
    exit 1
fi

# Definir IP do servidor
SERVER_IP=${SERVER_IP:-192.168.1.51}
echo ">> Usando IP do servidor: $SERVER_IP"

# Parar containers existentes
echo ""
echo ">> Parando containers existentes..."
docker-compose down 2>/dev/null || true

# Limpar volumes antigos (opcional)
read -p "Deseja limpar o banco de dados? (s/N): " clean_db
if [[ "$clean_db" == "s" || "$clean_db" == "S" ]]; then
    echo ">> Removendo volume do banco..."
    docker volume rm financeiro-network_postgres_data 2>/dev/null || true
fi

# Exportar variavel de ambiente para o frontend
export REACT_APP_BACKEND_URL="http://${SERVER_IP}:8001"
echo ">> REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL"

# Build e start dos containers
echo ""
echo ">> Construindo e iniciando containers..."
docker-compose up --build -d

# Aguardar postgres iniciar
echo ""
echo ">> Aguardando PostgreSQL iniciar..."
sleep 10

# Verificar status
echo ""
echo ">> Status dos containers:"
docker-compose ps

echo ""
echo "================================================="
echo " Deploy concluido!"
echo "================================================="
echo ""
echo " Frontend: http://${SERVER_IP}:3000"
echo " Backend:  http://${SERVER_IP}:8001"
echo " API Test: http://${SERVER_IP}:8001/api"
echo ""
echo " Para ver os logs: docker-compose logs -f"
echo " Para parar: docker-compose down"
echo "================================================="
