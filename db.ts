import oracledb from 'oracledb';

// QUITAR la línea de initOracleClient — modo Thin no la necesita
// oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient' });

const dbConfig = {
  user: process.env.ORACLE_USER!,
  password: process.env.ORACLE_PASSWORD!,
  connectString: process.env.ORACLE_CONNECT_STRING!,
};

export async function getConnection() {
  return await oracledb.getConnection(dbConfig);
}

export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    return (result.rows as T[]) || [];
  } finally {
    await conn.close();
  }
}

export async function execute(sql: string, params: any[] = []) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(sql, params, { autoCommit: true });
    return result;
  } finally {
    await conn.close();
  }
}