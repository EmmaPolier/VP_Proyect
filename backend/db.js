import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Configurar oracledb
oracledb.autoCommit = true;

const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectionString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`
};

// Pool de conexiones
let connectionPool;

export async function initializePool() {
  try {
    connectionPool = await oracledb.createPool({
      ...dbConfig,
      poolMin: 2,
      poolMax: 10,
      poolIncrement: 1,
      waitTimeout: 60000,
      timeout: 60
    });
    
    console.log('Pool de conexiones a Oracle XE creado exitosamente');
    return connectionPool;
  } catch (error) {
    console.error('Error al crear pool de conexiones:', error);
    process.exit(1);
  }
}

export async function getConnection() {
  try {
    if (!connectionPool) {
      await initializePool();
    }
    return await connectionPool.getConnection();
  } catch (error) {
    console.error('Error al obtener conexión:', error);
    throw error;
  }
}

export async function closePool() {
  try {
    if (connectionPool) {
      await connectionPool.close(0);
      console.log('Pool de conexiones cerrado');
    }
  } catch (error) {
    console.error('Error al cerrar pool:', error);
  }
}

export default { initializePool, getConnection, closePool };
