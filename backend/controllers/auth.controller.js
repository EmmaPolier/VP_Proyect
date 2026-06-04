import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../db.js';
import { sendOTP, sendPasswordResetEmail } from '../services/email.service.js';

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
      return res.status(400).json({ message: 'Email y contraseña son requeridos' });
    }

    if (!documento) {
      console.error('[ERROR] Documento vacío');
      return res.status(400).json({ message: 'El documento es requerido' });
    }

    if (!telefono) {
      console.error('[ERROR] Teléfono vacío');
      return res.status(400).json({ message: 'El teléfono es requerido' });
    }

    // Validar longitud de documento
    const docOnlyNumbers = documento.replace(/\D/g, '');
    if (docOnlyNumbers.length < 5 || docOnlyNumbers.length > 11) {
      console.error('[ERROR] Documento con formato inválido:', documento);
      return res.status(400).json({ message: 'El documento debe tener entre 5 y 11 dígitos' });
    }

    // Validar longitud de teléfono
    const phoneOnlyNumbers = telefono.replace(/\D/g, '');
    if (phoneOnlyNumbers.length !== 10) {
      console.error('[ERROR] Teléfono con formato inválido:', telefono);
      return res.status(400).json({ message: 'El teléfono debe tener exactamente 10 dígitos' });
    }

    if (!phoneOnlyNumbers.match(/^3\d{9}$/)) {
      console.error('[ERROR] Teléfono no comienza con 3:', telefono);
      return res.status(400).json({ message: 'El teléfono debe comenzar con 3' });
    }

    connection = await getConnection();

    const docValue = documento || email.split('@')[0];

    // Determinar perfil ANTES de validar
    const isConductor = finalRole === 'DRIVER' || finalRole === 'CONDUCTOR';
    const perfilId = isConductor ? 2 : 1;
    const nombrePerfil = isConductor ? 'CONDUCTOR' : 'PASAJERO';

    // Verificar si el usuario ya existe
    const existingUser = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE CORREO_USU = :email`,
      { email }
    );

    if (existingUser.rows && existingUser.rows.length > 0) {
      // Usuario existe, verificar si ya tiene este perfil
      const userDoc = existingUser.rows[0][0];
      
      const existingProfile = await connection.execute(
        `SELECT ID_PER_UPE FROM USUARIO_PERFIL 
         WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :perfilId`,
        { documento: userDoc, perfilId }
      );

      if (existingProfile.rows && existingProfile.rows.length > 0) {
        // Mismo perfil ya existe
        console.log('[ERROR] Usuario ya tiene el perfil', nombrePerfil);
        await connection.close();
        return res.status(400).json({ 
          message: `Ya estás registrado como ${nombrePerfil} con este email. Intenta con otro email o inicia sesión.` 
        });
      }

      // Perfil diferente - permitir agregar nuevo perfil
      console.log('[INFO] Usuario existente agregando perfil:', nombrePerfil);
      
      // El usuario ya existe, solo agregar el nuevo perfil
      await connection.execute(
        `INSERT INTO USUARIO_PERFIL (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
         VALUES (SEQ_USUARIO_PERFIL.NEXTVAL, :document, :perfilId, 5.0, SYSDATE)`,
        { document: userDoc, perfilId }
      );

      // Limpiar códigos OTP antiguos para este documento
      await connection.execute(
        `DELETE FROM VERIFICACION_CORREO WHERE DOCUMENTO_USU_VER = :document`,
        { document: userDoc }
      );

      // Generar nuevo OTP para verificar el nuevo perfil
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
        { document: userDoc, code, expiry }
      );

      // Enviar OTP al email del usuario
      try {
        await sendOTP(email, code);
        console.log('[INFO] OTP enviado para nuevo perfil:', nombrePerfil);
      } catch (emailError) {
        console.warn('[WARNING] No se pudo enviar OTP, pero el perfil fue agregado:', emailError.message);
      }

      await connection.close();

      return res.status(201).json({
        usuario: {
          documento: userDoc,
          email,
          nombres: finalNombre,
          perfil: nombrePerfil,
          nuevosPerfil: true
        },
        message: `Perfil de ${nombrePerfil} agregado exitosamente. Verifica tu email.`
      });
    }

    // Usuario NO existe, verificar documento como precaución adicional
    const existingDoc = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE DOCUMENTO_USU = :document`,
      { document: docValue }
    );

    // El documento no debería existir si el email no existe, pero verificamos igual
    if (existingDoc.rows && existingDoc.rows.length > 0) {
      // Caso raro pero posible: documento existe pero con diferente email
      const existingDocEmail = existingDoc.rows[0][0];
      
      const existingDocProfile = await connection.execute(
        `SELECT ID_PER_UPE FROM USUARIO_PERFIL 
         WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :perfilId`,
        { documento: existingDocEmail, perfilId }
      );

      if (existingDocProfile.rows && existingDocProfile.rows.length > 0) {
        console.log('[ERROR] Documento ya registrado con el mismo perfil:', docValue);
        await connection.close();
        return res.status(400).json({ 
          message: `Este documento ya está registrado como ${nombrePerfil}.` 
        });
      }

      // Documento existe pero con diferente perfil - permitir
      // (El usuario puede cambiar el email pero mantener el documento con otro perfil)
      console.log('[INFO] Documento existente con diferente perfil y email');
      
      await connection.execute(
        `INSERT INTO USUARIO_PERFIL (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
         VALUES (SEQ_USUARIO_PERFIL.NEXTVAL, :document, :perfilId, 5.0, SYSDATE)`,
        { document: existingDocEmail, perfilId }
      );

      await connection.close();

      return res.status(201).json({
        usuario: {
          documento: existingDocEmail,
          email,
          nombres: finalNombre,
          perfil: nombrePerfil,
        },
        message: `Perfil de ${nombrePerfil} agregado exitosamente. Puedes iniciar sesión.`
      });
    }

    // Hash de contraseña
    const hash = await bcryptjs.hash(finalPassword, 10);

    // Insertar usuario
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
    console.error('[ERROR] Error en register:', err.message, err.stack);
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[ERROR] Error al cerrar conexión:', closeErr.message);
      }
    }
    
    // Enviar mensaje genérico al cliente pero log detallado en servidor
    const errorMsg = err.message || 'Error interno del servidor';
    return res.status(500).json({ 
      message: `Error al procesar el registro: ${errorMsg}`,
      error: 'Error interno del servidor'
    });
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
  const { email, password, contrasena, perfilId } = req.body;
  
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

    // Obtener TODOS los perfiles del usuario
    const perfilesResult = await connection.execute(
      `SELECT ID_PER_UPE, CALIFICACION_UPE FROM USUARIO_PERFIL 
       WHERE DOCUMENTO_USU_UPE = :documento`,
      { documento }
    );

    const perfiles = perfilesResult.rows ? perfilesResult.rows.map(row => ({
      id: row[0],
      nombre: row[0] === 1 ? 'PASAJERO' : row[0] === 2 ? 'CONDUCTOR' : 'ADMIN',
      calificacion: row[1]
    })) : [];

    // Si no hay perfiles (caso raro), usar PASAJERO por defecto
    if (perfiles.length === 0) {
      await connection.execute(
        `INSERT INTO USUARIO_PERFIL (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
         VALUES (SEQ_USUARIO_PERFIL.NEXTVAL, :documento, 1, 5.0, SYSDATE)`,
        { documento }
      );
      perfiles.push({ id: 1, nombre: 'PASAJERO', calificacion: 5.0 });
    }

    // Si el usuario tiene perfil de ADMIN, usar ese automáticamente sin preguntar
    let selectedProfile = null;
    const adminProfile = perfiles.find(p => p.id === 3); // 3 = ADMIN
    
    if (adminProfile && !perfilId) {
      // Si tiene ADMIN, usarlo automáticamente
      selectedProfile = adminProfile;
      console.log('[INFO] Usuario ADMIN detectado, seleccionando automáticamente:', documento);
    } else if (perfiles.length > 1 && !perfilId) {
      // Si tiene múltiples perfiles (pero NO es admin) Y no especificó uno, devolver lista para selector
      console.log('[INFO] Usuario con múltiples perfiles (no admin):', documento, perfiles);
      await connection.close();
      return res.status(200).json({
        selectPerfil: true,
        documento,
        email,
        nombres,
        perfiles: perfiles
      });
    } else {
      // Un solo perfil o ya especificó perfilId
      selectedProfile = perfilId ? perfiles.find(p => p.id === parseInt(perfilId)) : perfiles[0];
    }
    
    // Si solicita un perfil que no tiene, rechazar
    if (!selectedProfile) {
      console.log('[ERROR] Perfil no válido para usuario:', documento, perfilId);
      await connection.close();
      return res.status(403).json({ error: 'No tienes acceso a ese perfil' });
    }

    await connection.close();

    // Generar JWT
    const token = jwt.sign(
      { documento, email, perfil: selectedProfile.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('[INFO] Login exitoso:', email, 'perfil:', selectedProfile.nombre);

    // Siempre devolver todos los perfiles si hay múltiples
    return res.json({
      id: documento,
      email,
      nombres,
      documento,
      id_perfil: selectedProfile.id,
      perfil_nombre: selectedProfile.nombre,
      calificacion: selectedProfile.calificacion,
      token,
      perfiles: perfiles.length > 1 ? perfiles : undefined
    });
  } catch (err) {
    console.error('[ERROR] Error en login:', err);
    if (connection) await connection.close();
    return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
  }
}

export async function forgotPassword(req, res) {
  const { email } = req.body;

  let connection;
  try {
    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }

    connection = await getConnection();

    // Buscar usuario por email
    const userResult = await connection.execute(
      `SELECT DOCUMENTO_USU, NOMBRES_USU FROM USUARIO WHERE CORREO_USU = :email`,
      { email }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      // No revelar si el email existe o no (seguridad)
      return res.status(200).json({ 
        message: 'Si el email está registrado, recibirás un link de recuperación' 
      });
    }

    const [documento, nombres] = userResult.rows[0];

    // Generar token JWT con expiración de 30 minutos
    const resetToken = jwt.sign(
      { documento, email, type: 'password-reset' },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Guardar token en la BD
    await connection.execute(
      `INSERT INTO RECUPERACION_CONTRASENA (
        ID_REC, DOCUMENTO_USU_REC, TOKEN_REC, 
        FECHA_EXPIRACION_REC, USADO_REC, FECHA_CREACION_REC
      ) VALUES (
        SEQ_RECUPERACION_CONTRASENA.NEXTVAL, :documento, :token,
        SYSDATE + (30/1440), 'N', SYSDATE
      )`,
      { documento, token: resetToken }
    );

    // Construir link de recuperación
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // Enviar email (sin bloquear si falla)
    try {
      await sendPasswordResetEmail(email, nombres, resetLink);
      console.log('[INFO] Email de recuperación enviado a:', email);
    } catch (emailError) {
      console.warn('[WARNING] Error enviando email de recuperación:', emailError.message);
      // Continuar aunque falle el email
    }

    await connection.close();

    // Respuesta exitosa genérica (por seguridad)
    return res.status(200).json({ 
      message: 'Si el email está registrado, recibirás un link de recuperación' 
    });
  } catch (err) {
    console.error('[ERROR] Error en forgotPassword:', err.message);
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[ERROR] Error cerrando conexión:', closeErr.message);
      }
    }
    return res.status(500).json({ 
      message: 'Error al procesar la solicitud de recuperación' 
    });
  }
}

export async function resetPassword(req, res) {
  const { token, newPassword, confirmPassword } = req.body;

  let connection;
  try {
    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        message: 'Token, contraseña nueva y confirmación son requeridos' 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        message: 'Las contraseñas no coinciden' 
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener mínimo 8 caracteres' 
      });
    }

    // Validar token JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ 
        message: 'El link de recuperación es inválido o ha expirado' 
      });
    }

    if (decoded.type !== 'password-reset') {
      return res.status(400).json({ 
        message: 'Token inválido' 
      });
    }

    connection = await getConnection();

    // Verificar que el token existe en la BD y no ha sido usado
    const tokenResult = await connection.execute(
      `SELECT ID_REC, USADO_REC, FECHA_EXPIRACION_REC 
       FROM RECUPERACION_CONTRASENA 
       WHERE TOKEN_REC = :token AND DOCUMENTO_USU_REC = :documento`,
      { token, documento: decoded.documento }
    );

    if (!tokenResult.rows || tokenResult.rows.length === 0) {
      await connection.close();
      return res.status(400).json({ 
        message: 'Token inválido o no encontrado' 
      });
    }

    const [idRec, usado, fechaExpiracion] = tokenResult.rows[0];

    if (usado === 'S') {
      await connection.close();
      return res.status(400).json({ 
        message: 'Este link de recuperación ya ha sido usado' 
      });
    }

    // Verificar si el token ha expirado
    const ahora = new Date();
    if (new Date(fechaExpiracion) < ahora) {
      await connection.close();
      return res.status(400).json({ 
        message: 'El link de recuperación ha expirado' 
      });
    }

    // Hash de la nueva contraseña
    const hash = await bcryptjs.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await connection.execute(
      `UPDATE USUARIO SET CONTRASENA_USU = :hash 
       WHERE DOCUMENTO_USU = :documento`,
      { hash, documento: decoded.documento }
    );

    // Marcar token como usado
    await connection.execute(
      `UPDATE RECUPERACION_CONTRASENA SET USADO_REC = 'S' 
       WHERE ID_REC = :id`,
      { id: idRec }
    );

    await connection.close();

    return res.status(200).json({ 
      message: 'Contraseña actualizada exitosamente. Puedes iniciar sesión.' 
    });
  } catch (err) {
    console.error('[ERROR] Error en resetPassword:', err.message);
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[ERROR] Error cerrando conexión:', closeErr.message);
      }
    }
    return res.status(500).json({ 
      message: 'Error al procesar el cambio de contraseña' 
    });
  }
}

// ============================================================================
// SWITCH ROLE - Cambiar de rol sin logout
// ============================================================================

export async function switchRole(req, res) {
  const { perfilId } = req.body;
  const documento = req.user?.documento;

  console.log('[INFO] Switch role solicitado:', { documento, perfilId });

  let connection;
  try {
    // Validar que el usuario esté autenticado
    if (!documento) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Validar que perfilId sea válido
    if (!perfilId || ![1, 2, 3].includes(parseInt(perfilId))) {
      return res.status(400).json({ error: 'Perfil inválido' });
    }

    connection = await getConnection();

    // Verificar que el usuario existe
    const userResult = await connection.execute(
      `SELECT CORREO_USU, NOMBRES_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento`,
      { documento }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      console.error('[ERROR] Usuario no encontrado:', documento);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const [email, nombres] = userResult.rows[0];

    // Verificar que el usuario tenga este perfil (PASO 2)
    const profileResult = await connection.execute(
      `SELECT ID_PER_UPE, CALIFICACION_UPE FROM USUARIO_PERFIL
       WHERE DOCUMENTO_USU_UPE = :documento AND ID_PER_UPE = :perfilId`,
      { documento, perfilId: parseInt(perfilId) }
    );

    if (!profileResult.rows || profileResult.rows.length === 0) {
      await connection.close();
      console.error('[ERROR] Usuario no tiene este perfil:', { documento, perfilId });
      return res.status(403).json({ error: 'No tienes acceso a este perfil' });
    }

    const calificacion = profileResult.rows[0][1];

    await connection.close();

    // Generar nuevo JWT con el perfil seleccionado (PASO 3)
    const newToken = jwt.sign(
      { 
        documento, 
        email, 
        perfil: parseInt(perfilId)
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Mapear ID a nombre de perfil
    const perfilNombre = 
      perfilId === 1 ? 'PASAJERO' : 
      perfilId === 2 ? 'CONDUCTOR' : 
      'ADMIN';

    console.log('[INFO] Role switch exitoso:', { documento, perfilNombre });

    return res.status(200).json({
      token: newToken,
      id_perfil: parseInt(perfilId),
      perfil_nombre: perfilNombre,
      calificacion,
      email,
      nombres,
      documento,
      message: `Ahora estás usando el perfil de ${perfilNombre}`
    });

  } catch (err) {
    console.error('[ERROR] Error en switchRole:', err.message, err.stack);
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('[ERROR] Error cerrando conexión:', closeErr.message);
      }
    }
    return res.status(500).json({ 
      error: 'Error al cambiar de rol',
      message: err.message 
    });
  }
}

export async function deleteAccount(req, res) {
  const documento = req.user?.documento;

  console.log('[INFO] Delete account solicitado para:', documento);

  let connection;
  try {
    // Validar que el usuario esté autenticado
    if (!documento) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    connection = await getConnection();

    // Verificar que el usuario existe
    const userResult = await connection.execute(
      `SELECT DOCUMENTO_USU FROM USUARIO WHERE DOCUMENTO_USU = :documento`,
      { documento }
    );

    if (!userResult.rows || userResult.rows.length === 0) {
      await connection.close();
      console.error('[ERROR] Usuario no encontrado para eliminación:', documento);
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    try {
      // Eliminar en orden correcto para respetar FK constraints
      // Nota: Cada DELETE será autocommit por defecto en Oracle
      
      console.log('[INFO] Eliminando datos dependientes...');
      
      // 1. Eliminar CALIFICACION (usa SOL_ID_CAL, RUT_ID_CAL)
      console.log('[INFO] Eliminando CALIFICACION...');
      await connection.execute(
        `DELETE FROM CALIFICACION 
         WHERE SOL_ID_CAL IN (
           SELECT ID_SOL FROM SOLICITUD_CUPO
           WHERE ID_UPE_SOL IN (
             SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
           )
         )`,
        { documento }
      );

      // 2. Eliminar HISTORIAL_VIAJE (usa SOL_ID_HIS, RUT_ID_HIS)
      console.log('[INFO] Eliminando HISTORIAL_VIAJE...');
      await connection.execute(
        `DELETE FROM HISTORIAL_VIAJE 
         WHERE SOL_ID_HIS IN (
           SELECT ID_SOL FROM SOLICITUD_CUPO
           WHERE ID_UPE_SOL IN (
             SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
           )
         )`,
        { documento }
      );

      // 3. Eliminar SOLICITUD_CUPO (que referencia USUARIO_PERFIL)
      console.log('[INFO] Eliminando SOLICITUD_CUPO...');
      await connection.execute(
        `DELETE FROM SOLICITUD_CUPO 
         WHERE ID_UPE_SOL IN (
           SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
         )`,
        { documento }
      );

      // 4. Eliminar CUPO_RUTA (que referencia RUTA)
      console.log('[INFO] Eliminando CUPO_RUTA...');
      await connection.execute(
        `DELETE FROM CUPO_RUTA 
         WHERE ID_RUT_CRU IN (
           SELECT ID_RUT FROM RUTA 
           WHERE ID_UPE_RUT IN (
             SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
           )
         )`,
        { documento }
      );

      // 5. Eliminar PUNTO_ENCUENTRO (que referencia RUTA)
      console.log('[INFO] Eliminando PUNTO_ENCUENTRO...');
      await connection.execute(
        `DELETE FROM PUNTO_ENCUENTRO 
         WHERE ID_RUT_PEN IN (
           SELECT ID_RUT FROM RUTA 
           WHERE ID_UPE_RUT IN (
             SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
           )
         )`,
        { documento }
      );

      // 6. Eliminar RUTA (que referencia USUARIO_PERFIL)
      console.log('[INFO] Eliminando RUTA...');
      await connection.execute(
        `DELETE FROM RUTA 
         WHERE ID_UPE_RUT IN (
           SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento
         )`,
        { documento }
      );

      // 7. Eliminar VEHICULO (que referencia USUARIO)
      console.log('[INFO] Eliminando VEHICULO...');
      await connection.execute(
        `DELETE FROM VEHICULO WHERE DOCUMENTO_USU_VEH = :documento`,
        { documento }
      );

      // 8. Eliminar USUARIO_PERFIL (que referencia USUARIO)
      console.log('[INFO] Eliminando USUARIO_PERFIL...');
      await connection.execute(
        `DELETE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = :documento`,
        { documento }
      );

      // 9. Eliminar TRANSACCIONES_CARTERA (que referencia USUARIO)
      console.log('[INFO] Eliminando TRANSACCIONES_CARTERA...');
      await connection.execute(
        `DELETE FROM TRANSACCIONES_CARTERA WHERE DOCUMENTO_USU_TRA = :documento`,
        { documento }
      );

      // 10. Eliminar VERIFICACION_CORREO (que referencia USUARIO)
      console.log('[INFO] Eliminando VERIFICACION_CORREO...');
      await connection.execute(
        `DELETE FROM VERIFICACION_CORREO WHERE DOCUMENTO_USU_VER = :documento`,
        { documento }
      );

      // 11. Eliminar USUARIO (tabla principal)
      console.log('[INFO] Eliminando USUARIO...');
      const deleteResult = await connection.execute(
        `DELETE FROM USUARIO WHERE DOCUMENTO_USU = :documento`,
        { documento }
      );

      await connection.close();

      console.log('[INFO] Cuenta eliminada exitosamente:', documento);

      return res.status(200).json({
        message: 'Cuenta eliminada exitosamente',
        documento
      });

    } catch (err) {
      await connection.close();
      throw err;
    }

  } catch (err) {
    console.error('[ERROR] Error en deleteAccount:', err.message, err.stack);
    return res.status(500).json({ 
      error: 'Error al eliminar la cuenta',
      message: err.message 
    });
  }
}
