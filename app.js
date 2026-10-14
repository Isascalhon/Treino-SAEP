// app.js - Arquivo principal do servidor
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors'); // Importar o pacote CORS
const usuariosRouter = require('./routes/usuarios');
const tarefasRouter = require('./routes/tarefas');

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors()); // Adicionar o middleware CORS
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Rotas API
app.use('/api/usuarios', usuariosRouter);
app.use('/api/tarefas', tarefasRouter);

// Rota para a página inicial
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;