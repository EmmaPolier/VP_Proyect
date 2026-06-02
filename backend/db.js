import oracledb from 'oracledb';
import dotenv from 'dotenv';
import os from 'os';

// Cargar .env (configuración universal para todo el equipo)
dotenv.config();

// Configurar oracledb
oracledb.autoCommit = true;

// Obtener el hostname de la máquina actual
const hostname = os.hostname();

// Crear múltiples configuraciones de conexión para mayor compatibilidad
// Usar EZ Connect (direct hostname:port/sid) en lugar de alias TNS
// para evitar problemas con tnsnames.ora
const dbConfigs = [
  // Intenta primero con host configurado desde .env
  {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`
  },
  // Intenta con localhost (funciona en cualquier PC con Oracle local)
  {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: `localhost:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`
  },
  // Intenta con 127.0.0.1 como fallback
  {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: `127.0.0.1:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`
  },
  // Intenta con hostname local
  {
    user: process.env.ORACLE_USER,
    password: process.env.ORACLE_PASSWORD,
    connectionString: `${hostname}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SID}`
  }
];

// Pool de conexiones
let connectionPool;
let activeConfigIndex = -1;

export async function initializePool() {
  try {
    for (let i = 0; i < dbConfigs.length; i++) {
      try {
        const config = dbConfigs[i];
        console.log(`[DB] Intentando conectar con: ${config.connectionString}`);
        
        connectionPool = await oracledb.createPool({
          ...config,
          poolMin: 2,
          poolMax: 10,
          poolIncrement: 1,
          waitTimeout: 60000,
          timeout: 60
        });
        
        activeConfigIndex = i;
        console.log(`[DB] ✓ Pool de conexiones a Oracle XE creado exitosamente`);
        console.log(`[DB] Conectado a: ${config.connectionString}`);
        return connectionPool;
      } catch (error) {
        console.warn(`[DB] Fallo con ${dbConfigs[i].connectionString}: ${error.message}`);
        if (i === dbConfigs.length - 1) {
          throw new Error('No se pudo conectar con ninguna configuración de Oracle');
        }
      }
    }
  } catch (error) {
    console.error('[DB] Error al crear pool de conexiones:', error.message);
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
    console.error('[DB] Error al obtener conexión:', error.message);
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
