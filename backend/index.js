import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializePool, closePool } from './db.js';

// Importar controladores directamente
import { register, verify, login } from './controllers/auth.controller.js';
import menuRoutes from './routes/menu.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';

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

// Rutas de menú
app.use('/menu', menuRoutes);

// Rutas de vehículos
app.use('/vehicles', vehicleRoutes);

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
