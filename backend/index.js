import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializePool, closePool, getConnection } from './db.js';

// Importar controladores directamente
import { register, verify, login, forgotPassword, resetPassword, switchRole } from './controllers/auth.controller.js';
import { authMiddleware } from './middlewares/auth.middleware.js';
import menuRoutes from './routes/menu.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import adminRoutes from './routes/admin/index.js';
import routeRoutes from './routes/route.routes.js';
import carteraRoutes from './routes/cartera.routes.js';
import calificacionRoutes from './routes/calificacion.routes.js';
import historialRoutes from './routes/historial.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';

// Cargar .env.local primero, luego .env (para sobreescrituras locales)
dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// ============================================================================
// MIDDLEWARES GLOBALES
// ============================================================================

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());


// ============================================================================
// RUTAS
// ============================================================================

// Rutas de autenticación (mantener sin prefijo para compatibilidad con frontend)
app.post('/register', register);
app.post('/verify', verify);
app.post('/login', login);
app.post('/forgot-password', forgotPassword);
app.post('/reset-password', resetPassword);
app.post('/switch-role', authMiddleware, switchRole);  // ← Requiere autenticación

// ============================================================================
// TESTING ENDPOINTS (DEVELOPMENT ONLY - REMOVE IN PRODUCTION)
// ============================================================================

app.post('/admin/verify-user-testing', async (req, res) => {
  const { email } = req.body;
  let connection;
  try {
    console.log(`[VERIFY-TEST] Verificando usuario: ${email}`);
    
    connection = await getConnection();
    console.log(`[VERIFY-TEST] Conexión obtenida`);
    
    const result = await connection.execute(
      `UPDATE USUARIO SET ID_EST_USU = 1 WHERE CORREO_USU = :email`,
      { email },
      { autoCommit: true }
    );
    console.log(`[VERIFY-TEST] Update result:`, result);
    
    res.json({ 
      message: 'Usuario verificado para testing', 
      email,
      rowsAffected: result.rowsAffected 
    });
  } catch (err) {
    console.error(`[VERIFY-TEST] Error:`, err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// TEST DATA SETUP - Inyectar datos de test para FASE 9
app.post('/api/test-data/setup', async (req, res) => {
  let connection;
  try {
    console.log('\n[TEST-DATA-SETUP] Iniciando inyección de datos de test...\n');
    
    connection = await getConnection();
    console.log('✅ Conexión a BD establecida');
    
    // Desactivar autocommit para transacciones
    connection.autoCommit = false;
    
    try {
      // 1. Crear vehículo para Davison
      console.log('📝 1. Creando vehículo...');
      let result = await connection.execute(
        `INSERT INTO VEHICULO (ID_VEH, DOCUMENTO_USU_VEH, ID_MM_VEH, ID_COL_VEH, ID_EST_VEH, PLACA_VEH, FECHA_REGISTRO_VEH)
         VALUES (SEQ_VEHICULO.NEXTVAL, '1234567890', 1, 1, 1, 'TEST001', SYSDATE)`,
        [],
        { autoCommit: false }
      );
      console.log('   ✅ Vehículo creado');
      
      // 2. Obtener ID_UPE de Davison CONDUCTOR
      console.log('📝 2. Obteniendo perfil de Davison...');
      result = await connection.execute(
        `SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = '1234567890' AND ID_PER_UPE = 2`,
        [],
        { outFormat: 1 } // Objeto
      );
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Davison no encontrado como CONDUCTOR');
      }
      
      const davisonUPE = result.rows[0].ID_UPE;
      console.log(`   ✅ Davison ID_UPE: ${davisonUPE}`);
      
      // 3. Obtener ID de vehículo recién creado
      console.log('📝 3. Obteniendo vehículo creado...');
      result = await connection.execute(
        `SELECT ID_VEH FROM VEHICULO WHERE DOCUMENTO_USU_VEH = '1234567890' ORDER BY ID_VEH DESC`,
        [],
        { outFormat: 1 }
      );
      
      const vehiculoId = result.rows[0].ID_VEH;
      console.log(`   ✅ Vehículo ID: ${vehiculoId}`);
      
      // 4. Crear RUTA
      console.log('📝 4. Creando ruta...');
      result = await connection.execute(
        `INSERT INTO RUTA (ID_RUT, ID_UPE_RUT, ID_VEH_RUT, ID_EST_RUT, LATITUD_ORIGEN_RUT, LONGITUD_ORIGEN_RUT, 
                           LATITUD_DESTINO_RUT, LONGITUD_DESTINO_RUT, HORA_SALIDA_RUT, CUPOS_TOTALES_RUT, 
                           CUPOS_DISPONIBLES_RUT, PRECIO_CUPO_RUT, DISTANCIA_KM_RUT, FECHA_CREACION_RUT, FECHA_ACTUALIZACION_RUT)
         VALUES (SEQ_RUTA.NEXTVAL, :davisonUPE, :vehiculoId, 1, 6.251839, -75.581228, 
                 6.197458, -75.567108, TRUNC(SYSDATE) + 14/24 + 30/(24*60), 3, 3, 8001, 12.5, SYSDATE, SYSDATE)`,
        { davisonUPE, vehiculoId },
        { autoCommit: false }
      );
      console.log('   ✅ Ruta creada');
      
      // 5. Obtener ID de ruta
      result = await connection.execute(
        `SELECT ID_RUT FROM RUTA WHERE ID_UPE_RUT = :davisonUPE ORDER BY ID_RUT DESC`,
        { davisonUPE },
        { outFormat: 1 }
      );
      
      const rutaId = result.rows[0].ID_RUT;
      console.log(`   ✅ Ruta ID: ${rutaId}`);
      
      // 6. Crear usuario pasajero
      console.log('📝 5. Creando usuario pasajero...');
      try {
        await connection.execute(
          `INSERT INTO USUARIO (DOCUMENTO_USU, NOMBRES_USU, PRIMER_APELLIDO_USU, SEGUNDO_APELLIDO_USU, 
                                CORREO_USU, NUMERO_TELEFONO_USU, FECHA_NACIMIENTO_USU, CONTRASENA_USU, 
                                FOTO_URL_USU, SALDO_CARTERA_USU, FECHA_CREACION_USU, ID_EST_USU)
           VALUES ('9999999999', 'Pasajero', 'Test', 'Usuario', 'pasajero.test@elpoli.edu.co', 
                   '3119999999', TO_DATE('2000-01-01', 'YYYY-MM-DD'), 
                   '$2a$10$m.htCWjBhq8sWi6cG0iNEOQGhAhYbvGlCCGqXKmvwATEOVxuAjCwm', 
                   'https://storage/fotos/default.jpg', 40000, SYSDATE, 1)`,
          [],
          { autoCommit: false }
        );
        console.log('   ✅ Usuario pasajero creado');
      } catch (err) {
        if (err.errorNum === 1) {
          console.log('   ⚠️  Usuario ya existe (ignorando)');
        } else {
          throw err;
        }
      }
      
      // 7. Crear perfil pasajero
      console.log('📝 6. Asignando perfil pasajero...');
      try {
        await connection.execute(
          `INSERT INTO USUARIO_PERFIL (ID_UPE, DOCUMENTO_USU_UPE, ID_PER_UPE, CALIFICACION_UPE, FECHA_ASIGNACION_UPE)
           VALUES (SEQ_USUARIO_PERFIL.NEXTVAL, '9999999999', 1, 5.0, SYSDATE)`,
          [],
          { autoCommit: false }
        );
        console.log('   ✅ Perfil asignado');
      } catch (err) {
        if (err.errorNum === 1) {
          console.log('   ⚠️  Perfil ya existe (ignorando)');
        } else {
          throw err;
        }
      }
      
      // 8. Obtener ID_UPE de pasajero
      result = await connection.execute(
        `SELECT ID_UPE FROM USUARIO_PERFIL WHERE DOCUMENTO_USU_UPE = '9999999999' AND ID_PER_UPE = 1`,
        [],
        { outFormat: 1 }
      );
      
      const pasajeroUPE = result.rows[0].ID_UPE;
      console.log(`   ✅ Pasajero ID_UPE: ${pasajeroUPE}`);
      
      // 9. Crear solicitud
      console.log('📝 7. Creando solicitud de cupo...');
      result = await connection.execute(
        `INSERT INTO SOLICITUD_CUPO (ID_SOL, ID_RUT_SOL, ID_UPE_SOL, ESTADO_SOL, FECHA_CREACION_SOL, FECHA_ACTUALIZACION_SOL)
         VALUES (SEQ_SOLICITUD.NEXTVAL, :rutaId, :pasajeroUPE, 'PENDIENTE', SYSDATE, SYSDATE)`,
        { rutaId, pasajeroUPE },
        { autoCommit: false }
      );
      console.log('   ✅ Solicitud creada');
      
      // 10. Obtener ID de solicitud
      result = await connection.execute(
        `SELECT ID_SOL FROM SOLICITUD_CUPO WHERE ID_RUT_SOL = :rutaId AND ESTADO_SOL = 'PENDIENTE' ORDER BY ID_SOL DESC`,
        { rutaId },
        { outFormat: 1 }
      );
      
      const solicitudId = result.rows[0].ID_SOL;
      
      // COMMIT TODAS LAS OPERACIONES
      await connection.commit();
      console.log('\n✅ COMMIT realizado - TODAS las operaciones confirmadas\n');
      
      // Respuesta exitosa
      res.status(200).json({
        status: true,
        message: 'Datos de test inyectados exitosamente',
        data: {
          vehiculoId,
          rutaId,
          pasajeroUPE,
          solicitudId,
          conductor: 'Davison (1234567890)',
          pasajero: 'Pasajero Test (9999999999)',
          rutaDetails: {
            cuposDisponibles: 3,
            precioCopp: 8001,
            estado: 'ACTIVA'
          }
        }
      });
      
    } catch (transactionErr) {
      await connection.rollback();
      console.error('\n❌ ERROR en transacción - ROLLBACK ejecutado\n', transactionErr);
      throw transactionErr;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message, '\n');
    res.status(500).json({
      status: false,
      error: error.message
    });
  } finally {
    if (connection) {
      connection.autoCommit = true;
      await connection.close();
    }
  }
});

// Rutas de menú
app.use('/menu', menuRoutes);

// Rutas de vehículos
app.use('/vehicles', vehicleRoutes);

// Rutas de usuarios
app.use('/users', usuarioRoutes);

// Rutas de administración
app.use('/api/admin', adminRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/cartera', carteraRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api', historialRoutes);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// ERROR HANDLER GLOBAL
// ============================================================================

app.use((err, req, res, next) => {
  console.error('[ERROR] Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: err.message
  });
});

// ============================================================================
// INICIAR SERVIDOR
// ============================================================================

initializePool()
  .then(() => {
    app.listen(port, () => {
      console.log(`[OK] Backend corriendo en http://localhost:${port}`);
      console.log(`[DB] Oracle conectado`);
      console.log(`[EMAIL] Email service listo`);
    });
  })
  .catch((err) => {
    console.error('[ERROR] Error al inicializar:', err);
    process.exit(1);
  });

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

process.on('SIGINT', async () => {
  console.log('\n[SHUTDOWN] Cerrando servidor...');
  await closePool();
  process.exit(0);
});
