import { getConnection } from '../db.js';

export async function getMenuByPerfil(req, res) {
  const { idPerfil } = req.params;

  let connection;
  try {
    if (!idPerfil) {
      return res.status(400).json({ error: 'ID de perfil requerido' });
    }

    connection = await getConnection();

    // Obtener menú del perfil
    const menuResult = await connection.execute(
      `SELECT 
        m.ID_MEN,
        m.URL_MEN,
        m.NOMBRE_MEN,
        m.ID_PADRE_MEN,
        m.ORDEN_MEN,
        mp.INSERT_MPE,
        mp.UPDATE_MPE,
        mp.DELETE_MPE,
        mp.SELECT_MPE
      FROM MENU m
      INNER JOIN MENU_PERFIL mp ON m.ID_MEN = mp.ID_MENU_MPE
      WHERE mp.ID_PERFIL_MPE = :idPerfil
      ORDER BY m.ORDEN_MEN ASC`,
      { idPerfil: parseInt(idPerfil) }
    );

    if (!menuResult.rows || menuResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ error: 'No hay menú disponible para este perfil' });
    }

    // Construir estructura de menú
    const menuItems = menuResult.rows.map(row => ({
      id: row[0],
      url: row[1],
      nombre: row[2],
      urlPadre: row[3],
      orden: row[4],
      permisos: {
        insert: row[5] === 'S',
        update: row[6] === 'S',
        delete: row[7] === 'S',
        select: row[8] === 'S'
      }
    }));

    // Organizar en árbol jerárquico (padre-hijo)
    const menuTree = menuItems
      .filter(item => !item.urlPadre)
      .map(parentItem => ({
        ...parentItem,
        children: menuItems.filter(child => child.urlPadre === parentItem.id)
      }));

    await connection.close();

    return res.json({
      menu: menuTree,
      total: menuItems.length
    });
  } catch (err) {
    console.error('[ERROR] Error al obtener menú:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
