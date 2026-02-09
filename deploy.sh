#!/bin/bash

# Script de Deploy Local - CashFlow Hub
# Este script prepara e inicia todo o ambiente Docker

set -e

echo "🚀 CashFlow Hub - Deploy Local"
echo "================================"
echo ""

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    echo "   Visite: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está disponível
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose não está disponível."
    exit 1
fi

echo "✅ Docker e Docker Compose detectados"
echo ""

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
docker compose down 2>/dev/null || true
echo ""

# Limpar volumes antigos (opcional - comentado por segurança)
# echo "🗑️  Limpando volumes antigos..."
# docker compose down -v
# echo ""

# Build das imagens
echo "🔨 Construindo imagens Docker..."
docker compose build --no-cache
echo ""

# Iniciar serviços
echo "🚀 Iniciando serviços..."
docker compose up -d
echo ""

# Aguardar PostgreSQL ficar pronto
echo "⏳ Aguardando PostgreSQL ficar pronto..."
sleep 5

# Verificar status dos serviços
echo ""
echo "📊 Status dos Serviços:"
docker compose ps
echo ""

# Verificar logs
echo "📝 Últimos logs do backend:"
docker compose logs backend | tail -10
echo ""

# Instruções finais
echo "================================"
echo "✅ Deploy concluído com sucesso!"
echo ""
echo "📍 Acesse o sistema:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8001/api"
echo ""
echo "🔧 Comandos úteis:"
echo "   Ver logs: docker compose logs -f"
echo "   Parar: docker compose down"
echo "   Restart: docker compose restart"
echo "   Limpar tudo: docker compose down -v"
echo ""
echo "📚 Primeiro acesso:"
echo "   1. Acesse http://localhost:3000"
echo "   2. Clique em 'Cadastre-se'"
echo "   3. Crie sua conta"
echo "   4. Configure suas caixinhas"
echo "   5. Comece a usar!"
echo ""
echo "================================"
