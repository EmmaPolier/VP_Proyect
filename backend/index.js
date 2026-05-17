import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { initializePool, getConnection, closePool } from './db.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// UTILITIES
// ============================================================================

const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Email transporter (configure with your Gmail credentials)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// ============================================================================
// PERMISSION VALIDATION UTILITIES
// ============================================================================

/**
 * Validar si un usuario tiene permiso para una acción en una URL específica
 * @param {number} idPerfil - ID del perfil del usuario
 * @param {string} url - URL/menú a validar
 * @param {string} action - Acción a validar: 'CREATE', 'READ', 'UPDATE', 'DELETE'
 * @returns {Promise<boolean>} - true si tiene permiso, false en caso contrario
 */
const validatePermission = async (idPerfil, url, action) => {
  try {
    const connection = await getConnection();
    
    // Buscar el menú por URL
    const menuResult = await connection.execute(
      `SELECT ID_MEN FROM MENU WHERE URL_MEN = :url`,
      { url }
    );

    if (!menuResult.rows || menuResult.rows.length === 0) {
      await connection.close();
      return false; // URL no existe en el menú
    }

    const [idMenu] = menuResult.rows[0];

    // Validar permiso en MENU_PERFIL
    const upperAction = action.toUpperCase();
    const permissionColumn = 
      upperAction === 'CREATE' ? 'INSERT_MPE' :
      upperAction === 'READ' ? 'SELECT_MPE' :
      upperAction === 'UPDATE' ? 'UPDATE_MPE' :
      upperAction === 'DELETE' ? 'DELETE_MPE' : null;

    if (!permissionColumn) {
      await connection.close();
      return false;
    }

    const permResult = await connection.execute(
      `SELECT ${permissionColumn} FROM MENU_PERFIL 
       WHERE ID_MENU_MPE = :idMenu AND ID_PERFIL_MPE = :idPerfil`,
      { idMenu, idPerfil }
    );

    await connection.close();

    if (!permResult.rows || permResult.rows.length === 0) {
      return false;
    }

    const [hasPermission] = permResult.rows[0];
    return hasPermission === 'S';
  } catch (error) {
    console.error('Error validating permission:', error);
    return false;
  }
};

/**
 * Middleware para validar permisos
 * Espera que req.body.idPerfil y req.body.url estén presentes
 */
const permissionMiddleware = (requiredAction) => {
  return async (req, res, next) => {
    try {
      const { idPerfil, url } = req.body;

      if (!idPerfil || !url) {
        return res.status(400).json({ 
          error: 'idPerfil y url son requeridos para validar permisos' 
        });
      }

      const hasPermission = await validatePermission(
        idPerfil,
        url,
        requiredAction
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: `Permiso denegado: no tienes permisos para ${requiredAction.toLowerCase()}`
        });
      }

      next();
    } catch (error) {
      console.error('Error en permission middleware:', error);
      res.status(500).json({ error: error.message });
    }
  };
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', async (req, res) => {
  try {
    const connection = await getConnection();
    
    // Test query to verify database connection
    const result = await connection.execute('SELECT 1 FROM DUAL');
    
    await connection.close();
    
    res.json({ 
      status: 'OK', 
      database: 'Oracle XE connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'ERROR', 
      error: error.message 
    });
  }
});

// ============================================================================
// AUTHENTICATION - REGISTER (CONDUCTOR/PASAJERO)
// ============================================================================

app.post('/register', async (req, res) => {
  const { 
    // Nuevo formato (driver-signup-form.tsx)
    name,
    email, 
    password,
    role,
    // Formato antiguo (signup-form.tsx)
    documento,
    nombres, 
    primerApellido,
    segundoApellido,
    telefono, 
    fechaNacimiento,
    contrasena,
    fotoUrl,
    perfil
  } = req.body;

  let connection;
  try {
    // Detectar qué formato está siendo usado
    const isNewFormat = !!(name || password || role);
    const isOldFormat = !!(documento && nombres && contrasena);

    if (!isNewFormat && !isOldFormat) {
      return res.status(400).json({ error: 'Formato de registro no válido' });
    }

    // Normalizar campos a valores comunes
    let docValue, nombreValue, primerApellidoValue, segundoApellidoValue, emailValue, telefonoValue, fechaNacimientoValue, passwordValue, perfilValue;

    if (isNewFormat) {
      // Formato nuevo: simplificar usando los valores enviados
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
      }

      docValue = documento || email.substring(0, 10).toUpperCase();
      nombreValue = name;
      primerApellidoValue = name.split(' ')[0] || name;
      segundoApellidoValue = name.split(' ').slice(1).join(' ') || null;
      emailValue = email;
      telefonoValue = telefono || '0000000000';
      fechaNacimientoValue = fechaNacimiento || '2000-01-01';
      passwordValue = password;
      perfilValue = role === 'DRIVER' ? 'CONDUCTOR' : (role || 'PASAJERO');
    } else {
      // Formato antiguo: usar los valores exactos
      docValue = documento;
      nombreValue = nombres;
      primerApellidoValue = primerApellido;
      segundoApellidoValue = segundoApellido || null;
      emailValue = email;
      telefonoValue = telefono || '0000000000';
      fechaNacimientoValue = fechaNacimiento || '2000-01-01';
      passwordValue = contrasena;
      perfilValue = perfil || 'PASAJERO';
    }

    connection = await getConnection();

    // Verificar si usuario ya existe
    const checkUser = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento`,
      { documento: docValue }
    );

    if (checkUser.rows && checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Obtener estado usuario (ACTIVO = 1)
    const estadoResult = await connection.execute(
      `SELECT ID_EUS FROM ESTADO_USUARIO WHERE NOMBRE_EUS = 'ACTIVO'`
    );
    
    const idEstado = estadoResult.rows ? estadoResult.rows[0][0] : 1;

    // Crear usuario
    const hashedPassword = hashPassword(passwordValue);
    
    await connection.execute(
      `INSERT INTO USUARIO 
       (DOCUMENTO_USU, NOMBRES_USU, PRIMER_APELLIDO_USU, SEGUNDO_APELLIDO_USU, 
        CORREO_USU, NUMERO_TELEFONO_USU, FECHA_NACIMIENTO_USU, 
        CONTRASENA_USU, FOTO_URL_USU, SALDO_CARTERA_USU, FECHA_CREACION_USU, ID_EST_USU)
       VALUES 
       (:documento, :nombres, :primerApellido, :segundoApellido,
        :email, :telefono, TO_DATE(:fechaNacimiento, 'YYYY-MM-DD'),
        :contrasena, :fotoUrl, 0, SYSDATE, :idEstado)`,
      {
        documento: docValue,
        nombres: nombreValue,
        primerApellido: primerApellidoValue,
        segundoApellido: segundoApellidoValue,
        email: emailValue,
        telefono: telefonoValue,
        fechaNacimiento: fechaNacimientoValue,
        contrasena: hashedPassword,
        fotoUrl: fotoUrl || 'https://via.placeholder.com/150',
        idEstado
      }
    );

    // Obtener perfil
    const perfilResult = await connection.execute(
      `SELECT ID_PER FROM PERFIL WHERE NOMBRE_PER = :perfil`,
      { perfil: perfilValue }
    );

    const idPerfil = perfilResult.rows ? perfilResult.rows[0][0] : 1;

    // Asignar perfil al usuario
    await connection.execute(
      `INSERT INTO USUARIO_PERFIL 
       (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
       VALUES 
       (SEQ_USUARIO_PERFIL.NEXTVAL, :documento, :idPerfil, 5.0, SYSDATE)`,
      {
        documento: docValue,
        idPerfil
      }
    );

    // Generar código de verificación
    const codigo = generateVerificationCode();
    const expiracion = new Date(Date.now() + 15 * 60000); // 15 minutos

    await connection.execute(
      `INSERT INTO VERIFICACION_CORREO 
       (ID_VER, DOCUMENTO_USU_VER, CODIGO_VER, FECHA_EXPIRACION_VER, USADO_VER, FECHA_CREACION_VER)
       VALUES 
       (SEQ_VERIFICACION_CORREO.NEXTVAL, :documento, :codigo, TO_DATE(:expiracion, 'YYYY-MM-DD HH24:MI:SS'), 'N', SYSDATE)`,
      {
        documento: docValue,
        codigo,
        expiracion: expiracion.toISOString().split('T').join(' ').substring(0, 19)
      }
    );

    // Enviar email (comentado por ahora)
    console.log(`Código de verificación para ${emailValue}: ${codigo}`);

    // Confirmar la transacción
    await connection.commit();

    // Retornar formato que el frontend espera
    if (isNewFormat) {
      // Formato nuevo (driver-signup-form.tsx)
      res.status(201).json({ 
        message: 'Usuario registrado. Verifica tu email.',
        id: docValue,
        email: emailValue,
        name: nombreValue
      });
    } else {
      // Formato antiguo (signup-form.tsx)
      res.status(201).json({ 
        message: 'Usuario registrado. Verifica tu email.',
        usuario: {
          documento: docValue,
          email: emailValue
        }
      });
    }

  } catch (error) {
    console.error('Error en register:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// LOGIN
// ============================================================================

app.post('/login', async (req, res) => {
  const { email, contrasena } = req.body;

  let connection;
  try {
    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    connection = await getConnection();

    // Buscar usuario por email y obtener su perfil
    const result = await connection.execute(
      `SELECT u.DOCUMENTO_USU, u.NOMBRES_USU, u.CORREO_USU, u.CONTRASENA_USU, up.ID_PER_UPE
       FROM USUARIO u
       LEFT JOIN USUARIO_PERFIL up ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       WHERE u.CORREO_USU = :email`,
      { email }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const [documento, nombres, correo, contrasenaGuardada, idPerfil] = result.rows[0];
    const hashedPassword = hashPassword(contrasena);

    if (hashedPassword !== contrasenaGuardada) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Retornar datos del usuario con id_perfil
    res.json({
      id: documento,
      nombres,
      email: correo,
      documento,
      id_perfil: idPerfil || 1  // Default a 1 (PASAJERO) si no tiene perfil asignado
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// GET ALL USERS
// ============================================================================

app.get('/users', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const result = await connection.execute(
      `SELECT DOCUMENTO_USU, NOMBRES_USU || ' ' || PRIMER_APELLIDO_USU as NOMBRE_COMPLETO, 
              CORREO_USU, NUMERO_TELEFONO_USU, SALDO_CARTERA_USU
       FROM USUARIO`,
      []
    );

    const usuarios = result.rows ? result.rows.map(row => ({
      documento: row[0],
      nombreCompleto: row[1],
      email: row[2],
      telefono: row[3],
      saldo: row[4]
    })) : [];

    res.json(usuarios);

  } catch (error) {
    console.error('Error en GET /users:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// REGISTER VEHICLE
// ============================================================================

app.post('/vehicles', async (req, res) => {
  const {
    driverId,
    brand,
    model,
    plate,
    color,
    soatUrl,
    licenciaUrl,
    tarjetaUrl,
    fotoUrl
  } = req.body;

  let connection;
  try {
    if (!driverId || !plate || !brand || !model || !color) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    // Validar longitud de placa (máximo 6 caracteres)
    if (plate.length > 6) {
      return res.status(400).json({ 
        error: `La placa "${plate}" excede el máximo de 6 caracteres permitidos. Recibido: ${plate.length} caracteres.` 
      });
    }

    connection = await getConnection();

    // Verificar que el usuario existe y es conductor
    const userResult = await connection.execute(
      `SELECT u.DOCUMENTO_USU FROM USUARIO u
       JOIN USUARIO_PERFIL up ON u.DOCUMENTO_USU = up.DOCUMENTO_USU_UPE
       JOIN PERFIL p ON up.ID_PER_UPE = p.ID_PER
       WHERE u.DOCUMENTO_USU = :documento AND p.NOMBRE_PER = 'CONDUCTOR'`,
      { documento: driverId }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no es conductor' });
    }

    // Obtener IDs de marca, modelo, color
    const marcaResult = await connection.execute(
      `SELECT ID_MAR FROM MARCA_VEHICULO WHERE NOMBRE_MAR = :brand`,
      { brand: brand.toUpperCase() }
    );
    
    if (!marcaResult.rows || marcaResult.rows.length === 0) {
      return res.status(400).json({ 
        error: `Marca "${brand}" no encontrada. Marcas disponibles: CHEVROLET, RENAULT, MAZDA, KIA, TOYOTA` 
      });
    }
    const marcaId = marcaResult.rows[0][0];

    const modeloResult = await connection.execute(
      `SELECT ID_MOD FROM MODELO_VEHICULO WHERE NOMBRE_MOD = :model`,
      { model: model.toUpperCase() }
    );
    
    if (!modeloResult.rows || modeloResult.rows.length === 0) {
      return res.status(400).json({ 
        error: `Modelo "${model}" no encontrado. Modelos disponibles: SPARK, SAIL, LOGAN, SANDERO, CX-3` 
      });
    }
    const modeloId = modeloResult.rows[0][0];

    const colorResult = await connection.execute(
      `SELECT ID_COL FROM COLOR_VEHICULO WHERE NOMBRE_COL = :color`,
      { color: color.toUpperCase() }
    );
    
    if (!colorResult.rows || colorResult.rows.length === 0) {
      return res.status(400).json({ 
        error: `Color "${color}" no encontrado. Colores disponibles: BLANCO, NEGRO, GRIS, ROJO, AZUL` 
      });
    }
    const colorId = colorResult.rows[0][0];

    // Obtener estado ACTIVO para vehículos
    const estadoResult = await connection.execute(
      `SELECT ID_EVE FROM ESTADO_VEHICULO WHERE NOMBRE_EVE = 'ACTIVO'`
    );
    
    if (!estadoResult.rows || estadoResult.rows.length === 0) {
      return res.status(500).json({ error: 'Estado ACTIVO no configurado en la base de datos' });
    }
    const idEstado = estadoResult.rows[0][0];

    console.log('Preparando INSERT VEHICULO con:',  {
      documento: driverId,
      marcaId,
      modeloId,
      colorId,
      idEstado,
      placa: plate,
      soatUrl: soatUrl || null,
      licenciaUrl: licenciaUrl || null,
      tarjetaUrl: tarjetaUrl || null,
      vehiculoUrl: fotoUrl || null
    });

    // Crear vehículo
    await connection.execute(
      `INSERT INTO VEHICULO 
       (ID_VEH, DOCUMENTO_USU_VEH, ID_MAR_VEH, ID_MOD_VEH, ID_COL_VEH, 
        ID_EST_VEH, PLACA_VEH, SOAT_URL_VEH, LICENCIA_URL_VEH, 
        TARJETA_URL_VEH, VEHICULO_URL_VEH, FECHA_REGISTRO_VEH)
       VALUES 
       (SEQ_VEHICULO.NEXTVAL, :documento, :marcaId, :modeloId, :colorId,
        :idEstado, :placa, :soatUrl, :licenciaUrl, :tarjetaUrl, :vehiculoUrl, SYSDATE)`,
      {
        documento: driverId,
        marcaId,
        modeloId,
        colorId,
        idEstado,
        placa: plate,
        soatUrl: soatUrl || null,
        licenciaUrl: licenciaUrl || null,
        tarjetaUrl: tarjetaUrl || null,
        vehiculoUrl: fotoUrl || null
      }
    );

    await connection.commit();

    res.status(201).json({
      message: 'Vehículo registrado exitosamente',
      placa: plate
    });

  } catch (error) {
    console.error('Error en POST /vehicles:', error);
    console.error('Stack:', error.stack);
    
    // Retornar error más específico
    let errorMessage = 'Error al registrar el vehículo';
    
    if (error.code === 'ORA-01400') {
      errorMessage = 'Campo requerido faltante en la base de datos';
    } else if (error.code === 'ORA-02291') {
      errorMessage = 'Referencia inválida (usuario, marca, modelo o color no existe)';
    } else if (error.code === 'ORA-00001') {
      errorMessage = 'La placa del vehículo ya existe';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ error: errorMessage });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// VERIFY EMAIL
// ============================================================================

app.post('/verify', async (req, res) => {
  const { email, code } = req.body;

  let connection;
  try {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código requeridos' });
    }

    connection = await getConnection();

    // Obtener documento del usuario por email
    const usuarioResult = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE CORREO_USU = :email`,
      { email }
    );

    if (!usuarioResult.rows || usuarioResult.rows.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const documento = usuarioResult.rows[0][0];

    // Verificar código
    const result = await connection.execute(
      `SELECT CODIGO_VER, FECHA_EXPIRACION_VER, USADO_VER FROM VERIFICACION_CORREO
       WHERE DOCUMENTO_USU_VER = :documento 
       AND USADO_VER = 'N'
       ORDER BY FECHA_EXPIRACION_VER DESC`,
      { documento }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(400).json({ error: 'No hay código de verificación activo' });
    }

    const [codigoGuardado, fechaExpiracion, usado] = result.rows[0];

    if (codigoGuardado !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    // Marcar como usado
    await connection.execute(
      `UPDATE VERIFICACION_CORREO 
       SET USADO_VER = 'S'
       WHERE DOCUMENTO_USU_VER = :documento AND CODIGO_VER = :codigo`,
      { documento, codigo: code }
    );

    // Obtener rol del usuario
    const perfilResult = await connection.execute(
      `SELECT p.NOMBRE_PER FROM USUARIO_PERFIL up
       JOIN PERFIL p ON up.ID_PER_UPE = p.ID_PER
       WHERE up.DOCUMENTO_USU_UPE = :documento`,
      { documento }
    );

    const rol = perfilResult.rows ? perfilResult.rows[0][0] : 'PASAJERO';

    // Confirmar cambios
    await connection.commit();

    res.json({
      message: 'Email verificado exitosamente',
      id: documento,
      email: email,
      role: rol
    });

  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// GET DYNAMIC MENU BY PROFILE
// ============================================================================

app.get('/menu/:idPerfil', async (req, res) => {
  let connection;
  try {
    const { idPerfil } = req.params;

    if (!idPerfil) {
      return res.status(400).json({ error: 'ID de perfil requerido' });
    }

    connection = await getConnection();

    const result = await connection.execute(`
      SELECT 
        m.ID_MEN,
        m.NOMBRE_MEN,
        m.URL_MEN,
        m.ORDEN_MEN,
        mp.INSERT_MPE,
        mp.UPDATE_MPE,
        mp.DELETE_MPE,
        mp.SELECT_MPE
      FROM MENU m
      JOIN MENU_PERFIL mp ON m.ID_MEN = mp.ID_MENU_MPE
      WHERE mp.ID_PERFIL_MPE = :idPerfil
      ORDER BY m.ORDEN_MEN
    `, { idPerfil: parseInt(idPerfil) });

    const menuItems = result.rows ? result.rows.map(row => ({
      id: row[0],
      nombre: row[1],
      url: row[2],
      orden: row[3],
      permisos: {
        crear: row[4] === 'S',
        actualizar: row[5] === 'S',
        eliminar: row[6] === 'S',
        leer: row[7] === 'S'
      }
    })) : [];

    res.json({
      status: 'OK',
      perfil: parseInt(idPerfil),
      menu: menuItems,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en GET /menu/:idPerfil:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al obtener menú',
      error: error.message
    });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
});

// ============================================================================
// VALIDATE PERMISSIONS
// ============================================================================

app.post('/validate-permission', async (req, res) => {
  const { idPerfil, url, action } = req.body;

  try {
    if (!idPerfil || !url || !action) {
      return res.status(400).json({
        error: 'idPerfil, url y action son requeridos'
      });
    }

    const hasPermission = await validatePermission(idPerfil, url, action);

    res.json({
      status: 'OK',
      idPerfil,
      url,
      action,
      hasPermission,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en POST /validate-permission:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Error al validar permiso',
      error: error.message
    });
  }
});

// ============================================================================
// START SERVER
// ============================================================================

async function startServer() {
  try {
    await initializePool();
    
    app.listen(port, () => {
      console.log(`\nBackend corriendo en http://localhost:${port}`);
      console.log(`Conectado a Oracle XE`);
      console.log(`Health check: http://localhost:${port}/health\n`);
    });
  } catch (error) {
    console.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing pool...');
  await closePool();
  process.exit(0);
});

startServer();
