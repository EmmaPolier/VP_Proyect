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

// Rutas de menú
app.use('/menu', menuRoutes);

// Rutas de vehículos
app.use('/vehicles', vehicleRoutes);

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
