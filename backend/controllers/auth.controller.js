import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';
import { sendOTP } from '../services/email.service.js';

export async function register(req, res) {
  // Aceptar nombres de campos del frontend
  const { 
    name, email, password, role,
    documento, nombres, primerApellido, segundoApellido,
    telefono, fechaNacimiento, contrasena, perfil
  } = req.body;

  console.log('[DEBUG] Datos recibidos en register:', {
    email, documento, nombres, primerApellido, telefono, fechaNacimiento, contrasena: '***', perfil
  });

  // Usar valores correctos (frontend envia contrasena y perfil)
  const finalPassword = password || contrasena;
  const finalRole = role || perfil;
  const finalNombre = name || nombres;

  let connection;
  try {
    // Validar campos requeridos
    if (!email || !finalPassword) {
      console.error('[ERROR] Validación fallida: email o password vacíos', { email, finalPassword: finalPassword ? '[presente]' : '[vacío]' });
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    connection = await getConnection();

    // Verificar si el email ya existe
    const existing = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE CORREO_USU = :email`,
      { email }
    );

    if (existing.rows && existing.rows.length > 0) {
      console.log('[ERROR] Email ya registrado:', email);
      await connection.close();
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Hash de contraseña
    const hash = await bcryptjs.hash(finalPassword, 10);

    // Determinar perfil (PASAJERO=1, CONDUCTOR=2)
    // Frontend puede enviar: "DRIVER"/"CONDUCTOR" o "PASSENGER"/"PASAJERO"
    const isConductor = finalRole === 'DRIVER' || finalRole === 'CONDUCTOR';
    const perfilId = isConductor ? 2 : 1;

    // Insertar usuario
    const docValue = documento || email.split('@')[0];
    const telefonoValue = telefono || '0000000000';
    const primerApellidoValue = primerApellido || '';
    const segundoApellidoValue = segundoApellido || '';
    
    // Convertir fecha de DD/MM/YYYY a YYYY-MM-DD para que Oracle la interprete
    let birthDateValue = null;
    if (fechaNacimiento) {
      // Si viene en formato DD/MM/YYYY, convertir a YYYY-MM-DD
      const fechaParts = fechaNacimiento.split('/');
      if (fechaParts.length === 3) {
        const [day, month, year] = fechaParts;
        birthDateValue = `${year}-${month}-${day}`;
      }
    }
    
    await connection.execute(
      `INSERT INTO USUARIO (
        DOCUMENTO_USU, NOMBRES_USU, PRIMER_APELLIDO_USU, SEGUNDO_APELLIDO_USU,
        CORREO_USU, NUMERO_TELEFONO_USU, FECHA_NACIMIENTO_USU,
        CONTRASENA_USU, FOTO_URL_USU, SALDO_CARTERA_USU,
        FECHA_CREACION_USU, ID_EST_USU
      ) VALUES (
        :document, :name, :primerApellido, :segundoApellido,
        :email, :telefono, TO_DATE(:birthDate, 'YYYY-MM-DD'),
        :hash, 'https://storage/fotos/default.jpg', 0,
        SYSDATE, 4
      )`,
      {
        document: docValue,
        name: finalNombre || 'Usuario',
        primerApellido: primerApellidoValue,
        segundoApellido: segundoApellidoValue,
        email,
        telefono: telefonoValue,
        birthDate: birthDateValue || '2000-01-01',
        hash
      }
    );

    // Asignar perfil
    await connection.execute(
      `INSERT INTO USUARIO_PERFIL (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
       VALUES (SEQ_USUARIO_PERFIL.NEXTVAL, :document, :perfilId, 5.0, SYSDATE)`,
      { document: docValue, perfilId }
    );

    // Generar OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await connection.execute(
      `INSERT INTO VERIFICACION_CORREO (
        ID_VER, DOCUMENTO_USU_VER, CODIGO_VER,
        FECHA_EXPIRACION_VER, USADO_VER, FECHA_CREACION_VER
      ) VALUES (
        SEQ_VERIFICACION_CORREO.NEXTVAL, :document, :code,
        :expiry, 'N', SYSDATE
      )`,
      { document: docValue, code, expiry }
    );

    // Enviar OTP (sin bloquear si falla)
    try {
      await sendOTP(email, code);
    } catch (emailError) {
      console.warn('[WARNING] No se pudo enviar OTP, pero el registro fue exitoso');
    }

    await connection.close();

    return res.status(201).json({
      usuario: {
        documento: docValue,
        email,
        nombres: finalNombre,
        perfil: isConductor ? 'CONDUCTOR' : 'PASAJERO'
      },
      message: 'Registro exitoso. Verifica tu email.'
    });
  } catch (err) {
    console.error('[ERROR] Error en register:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}

export async function verify(req, res) {
  const { email, code } = req.body;

  let connection;
  try {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email y código son requeridos' });
    }

    connection = await getConnection();

    // Obtener usuario por email
    const userResult = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE CORREO_USU = :email`,
      { email }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const documento = userResult.rows[0][0];

    // Buscar OTP válido
    const otpResult = await connection.execute(
      `SELECT ID_VER, USADO_VER FROM VERIFICACION_CORREO
       WHERE DOCUMENTO_USU_VER = :documento AND CODIGO_VER = :code AND USADO_VER = 'N'
       AND FECHA_EXPIRACION_VER > SYSDATE`,
      { documento, code }
    );

    if (!otpResult.rows || otpResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ error: 'Código inválido o expirado' });
    }

    const idVerification = otpResult.rows[0][0];

    // Marcar OTP como usado
    await connection.execute(
      `UPDATE VERIFICACION_CORREO SET USADO_VER = 'S' WHERE ID_VER = :id`,
      { id: idVerification }
    );

    // Actualizar estado del usuario a ACTIVO (1)
    await connection.execute(
      `UPDATE USUARIO SET ID_EST_USU = 1 WHERE DOCUMENTO_USU = :documento`,
      { documento }
    );

    // Obtener perfil del usuario
    const perfResult = await connection.execute(
      `SELECT ID_PER_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento`,
      { documento }
    );

    const perfilId = perfResult.rows && perfResult.rows.length > 0 ? perfResult.rows[0][0] : 1;
    const perfilNombre = perfilId === 2 ? 'CONDUCTOR' : perfilId === 3 ? 'ADMIN' : 'PASAJERO';

    await connection.close();

    return res.json({
      id: documento,
      email,
      role: perfilNombre,
      message: 'Email verificado exitosamente'
    });
  } catch (err) {
    console.error('[ERROR] Error en verify:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}

export async function login(req, res) {
  const { email, password, contrasena } = req.body;
  
  // Frontend envía "contrasena", así que aceptar ambos nombres
  const finalPassword = password || contrasena;

  let connection;
  try {
    if (!email || !finalPassword) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    connection = await getConnection();

    // Buscar usuario
    const userResult = await connection.execute(
      `SELECT DOCUMENTO_USU, CONTRASENA_USU, ID_EST_USU, NOMBRES_USU FROM USUARIO 
       WHERE CORREO_USU = :email`,
      { email }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [documento, hash, estado, nombres] = userResult.rows[0];

    // Verificar estado (ACTIVO = 1)
    if (estado !== 1) {
      await connection.close();
      return res.status(403).json({ error: 'Cuenta no verificada o suspendida' });
    }

    // Verificar contraseña
    const validPassword = await bcryptjs.compare(finalPassword, hash);
    if (!validPassword) {
      await connection.close();
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Obtener perfil del usuario
    const perfResult = await connection.execute(
      `SELECT ID_PER_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento`,
      { documento }
    );

    const perfilId = perfResult.rows && perfResult.rows.length > 0 ? perfResult.rows[0][0] : 1;

    await connection.close();

    // Generar JWT
    const token = jwt.sign(
      { documento, email, perfil: perfilId },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      id: documento,
      email,
      nombres,
      documento,
      id_perfil: perfilId,
      token
    });
  } catch (err) {
    console.error('[ERROR] Error en login:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}
