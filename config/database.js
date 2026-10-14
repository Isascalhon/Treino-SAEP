// config/database.js - Configuração da conexão com o MySQL
const mysql = require('mysql2/promise');

// Criação do pool de conexões
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root', // Substitua pela sua senha do MySQL
  database: 'gerenciamento_tarefas',
  port:3307,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;