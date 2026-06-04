import { getConnection } from '../db.js';
import bcrypt from 'bcryptjs';

/**
 * Obtener información del perfil del usuario autenticado
 */
export async function getProfileInfo(req, res) {
  const documento = req.user?.documento;
  console.log('[PERFIL-CONTROLLER] getProfileInfo - documento:', documento);
  
  if (!documento) {
    return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Obtener información del usuario
    const result = await connection.execute(
      `SELECT 
        DOCUMENTO_USU,
        NOMBRES_USU,
        PRIMER_APELLIDO_USU,
        SEGUNDO_APELLIDO_USU,
        CORREO_USU,
        NUMERO_TELEFONO_USU,
        FECHA_NACIMIENTO_USU,
        FOTO_URL_USU,
        FECHA_CREACION_USU,
        ID_EST_USU,
        SALDO_CARTERA_USU
       FROM USUARIO 
       WHERE DOCUMENTO_USU = :doc`,
      { doc: documento }
    );

    console.log('[PERFIL-CONTROLLER] Usuario query result:', result.rows?.length);

    if (!result.rows || result.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const row = result.rows[0];
    const userProfile = {
      documento: row[0],
      nombres: row[1] || '',
      primerApellido: row[2] || '',
      segundoApellido: row[3] || '',
      email: row[4] || '',
      telefono: row[5] || '',
      fechaNacimiento: row[6] || null,
      fotoUrl: row[7] || null,
      fechaCreacion: row[8] || null,
      idEstado: row[9] || null,
      saldoCartera: row[10] || 0
    };

    console.log('[PERFIL-CONTROLLER] userProfile:', userProfile);

    // Obtener los perfiles del usuario
    const perfilesResult = await connection.execute(
      `SELECT 
        p.ID_PER,
        p.NOMBRE_PER,
        NVL(up.CALIFICACION_UPE, 5.0) as CALIFICACION_UPE
       FROM USUARIO_PERFIL up
       JOIN PERFIL p ON up.ID_PER_UPE = p.ID_PER
       WHERE up.DOCUMENTO_USU_UPE = :doc
       ORDER BY p.ID_PER`,
      { doc: documento }
    );

    console.log('[PERFIL-CONTROLLER] Perfiles result:', perfilesResult.rows?.length);

    const perfiles = (perfilesResult.rows || []).map(row => ({
      id: row[0],
      nombre: row[1],
      calificacion: row[2]
    }));

    console.log('[PERFIL-CONTROLLER] Perfiles mapped:', perfiles);

    await connection.close();

    return res.json({
      success: true,
      data: { ...userProfile, perfiles },
      message: 'Perfil obtenido exitosamente'
    });
  } catch (err) {
    console.error('[PERFIL-CONTROLLER] getProfileInfo ERROR:', err);
    if (connection) await connection.close();
    return res.status(500).json({ 
      success: false,
      error: 'Error al obtener perfil',
      details: err.message 
    });
  }
}

/**
 * Actualizar información del perfil (teléfono, email, nombres)
 */
export async function updateProfileInfo(req, res) {
  const documento = req.user?.documento;
  console.log('[PERFIL-CONTROLLER] updateProfileInfo - documento:', documento);
  
  if (!documento) {
    return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  }

  const { email, telefono, nombres, primerApellido, segundoApellido } = req.body;
  console.log('[PERFIL-CONTROLLER] updateProfileInfo - datos:', { email, telefono, nombres });

  if (!email && !telefono && !nombres && !primerApellido && !segundoApellido) {
    return res.status(400).json({ success: false, error: 'Debe proporcionar al menos un campo para actualizar' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Verificar si el email ya existe en otro usuario
    if (email) {
      const emailCheck = await connection.execute(
        `SELECT DOCUMENTO_USU FROM USUARIO WHERE CORREO_USU = :email AND DOCUMENTO_USU != :doc`,
        { email, doc: documento }
      );

      if (emailCheck.rows && emailCheck.rows.length > 0) {
        await connection.close();
        return res.status(400).json({ success: false, error: 'El email ya está registrado por otro usuario' });
      }
    }

    // Construir UPDATE dinámico
    let updateFields = [];
    let params = { doc: documento };

    if (email) {
      updateFields.push('CORREO_USU = :email');
      params.email = email;
    }
    if (telefono) {
      updateFields.push('NUMERO_TELEFONO_USU = :telefono');
      params.telefono = telefono;
    }
    if (nombres) {
      updateFields.push('NOMBRES_USU = :nombres');
      params.nombres = nombres;
    }
    if (primerApellido) {
      updateFields.push('PRIMER_APELLIDO_USU = :primerApellido');
      params.primerApellido = primerApellido;
    }
    if (segundoApellido) {
      updateFields.push('SEGUNDO_APELLIDO_USU = :segundoApellido');
      params.segundoApellido = segundoApellido;
    }

    const updateQuery = `UPDATE USUARIO SET ${updateFields.join(', ')} WHERE DOCUMENTO_USU = :doc`;
    console.log('[PERFIL-CONTROLLER] updateQuery:', updateQuery);

    const result = await connection.execute(updateQuery, params, { autoCommit: false });
    console.log('[PERFIL-CONTROLLER] UPDATE rowsAffected:', result.rowsAffected);

    if (result.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    await connection.commit();
    await connection.close();

    return res.json({
      success: true,
      message: 'Perfil actualizado exitosamente'
    });
  } catch (err) {
    console.error('[PERFIL-CONTROLLER] updateProfileInfo ERROR:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('[PERFIL-CONTROLLER] Rollback failed:', rollbackErr);
      }
      await connection.close();
    }
    return res.status(500).json({ 
      success: false,
      error: 'Error al actualizar perfil', 
      details: err.message 
    });
  }
}

/**
 * Cambiar contraseña del usuario
 */
export async function changePassword(req, res) {
  const documento = req.user?.documento;
  console.log('[PERFIL-CONTROLLER] changePassword - documento:', documento);
  
  if (!documento) {
    return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
  }

  const { passwordActual, passwordNueva, passwordConfirm } = req.body;

  if (!passwordActual || !passwordNueva || !passwordConfirm) {
    return res.status(400).json({ success: false, error: 'Todos los campos son requeridos' });
  }

  if (passwordNueva !== passwordConfirm) {
    return res.status(400).json({ success: false, error: 'Las contraseñas no coinciden' });
  }

  if (passwordNueva.length < 8) {
    return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  let connection;
  try {
    connection = await getConnection();

    // Obtener contraseña actual
    const userResult = await connection.execute(
      `SELECT CONTRASENA_USU FROM USUARIO WHERE DOCUMENTO_USU = :doc`,
      { doc: documento }
    );

    console.log('[PERFIL-CONTROLLER] Usuario encontrado:', userResult.rows?.length);

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    const hashedPassword = userResult.rows[0][0];

    // Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(passwordActual, hashedPassword);
    console.log('[PERFIL-CONTROLLER] Password válida:', isPasswordValid);
    
    if (!isPasswordValid) {
      await connection.close();
      return res.status(401).json({ success: false, error: 'La contraseña actual es incorrecta' });
    }

    // Hash nueva contraseña
    const newHashedPassword = await bcrypt.hash(passwordNueva, 10);

    // Actualizar contraseña
    const updateResult = await connection.execute(
      `UPDATE USUARIO SET CONTRASENA_USU = :newPassword WHERE DOCUMENTO_USU = :doc`,
      { newPassword: newHashedPassword, doc: documento },
      { autoCommit: false }
    );

    console.log('[PERFIL-CONTROLLER] Password UPDATE rowsAffected:', updateResult.rowsAffected);

    if (updateResult.rowsAffected === 0) {
      await connection.close();
      return res.status(404).json({ success: false, error: 'No se pudo actualizar la contraseña' });
    }

    await connection.commit();
    await connection.close();

    return res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (err) {
    console.error('[PERFIL-CONTROLLER] changePassword ERROR:', err);
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('[PERFIL-CONTROLLER] Rollback failed:', rollbackErr);
      }
      await connection.close();
    }
    return res.status(500).json({ 
      success: false,
      error: 'Error al cambiar contraseña', 
      details: err.message 
    });
  }
}

export default { getProfileInfo, updateProfileInfo, changePassword };
