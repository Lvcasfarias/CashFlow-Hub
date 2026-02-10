const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3000;

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
const dividasRoutes = require('./routes/dividas');
const dashboardsRoutes = require('./routes/dashboards');
const cartoesRoutes = require('./routes/cartoes');
const metasRoutes = require('./routes/metas');
const categoriasRoutes = require('./routes/categorias');
const contasRoutes = require('./routes/contas');

// Rotas da API
app.get('/api', (req, res) => {
  res.json({ message: 'API Sistema Financeiro - Funcionando!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/caixinhas', caixinhasRoutes);
app.use('/api/transacoes', transacoesRoutes);
app.use('/api/recorrencias', recorrenciasRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/dividas', dividasRoutes);
app.use('/api/dashboards', dashboardsRoutes);
app.use('/api/cartoes', cartoesRoutes);
app.use('/api/metas', metasRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/contas', contasRoutes);

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro:', err.stack);
  res.status(500).json({ error: 'Algo deu errado!' });
});

// Iniciar servidor
app.listen(PORT, 'localhost', () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
