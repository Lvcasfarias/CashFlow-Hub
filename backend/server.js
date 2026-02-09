const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Importar rotas
const authRoutes = require('./routes/auth');
const caixinhasRoutes = require('./routes/caixinhas');
const transacoesRoutes = require('./routes/transacoes');
const recorrenciasRoutes = require('./routes/recorrencias');
const wishlistRoutes = require('./routes/wishlist');

// Rotas da API
app.get('/api', (req, res) => {
  res.json({ message: 'API Sistema Financeiro - Funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/caixinhas', caixinhasRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/recorrencias', recorrenciasRoutes);
app.use('/api/wishlist', wishlistRoutes);

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
