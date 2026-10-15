import mysql from 'mysql2/promise';

const globalForMysql = globalThis;

function createPool() {
  const port = Number(process.env.DB_PORT || process.env.MYSQLPORT || 3307);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('DB_PORT/MYSQLPORT deve ser uma porta válida (1–65535).');
  }

  return mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'root',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'gerenciamento_tarefas',
    port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

// Reaproveita o pool no modo de desenvolvimento, evitando conexões duplicadas
// durante o hot reload do Next.js.
const pool = globalForMysql.mysqlPool ?? createPool();
if (process.env.NODE_ENV !== 'production') {
  globalForMysql.mysqlPool = pool;
}

export default pool;
