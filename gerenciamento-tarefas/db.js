import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'root',
  database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'gerenciamento_tarefas',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3307),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
