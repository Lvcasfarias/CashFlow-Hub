# Dockerfile para o Backend Node.js
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código da aplicação
COPY . .

# Expor porta
EXPOSE 8001

# Comando para iniciar
CMD ["node", "server.js"]
