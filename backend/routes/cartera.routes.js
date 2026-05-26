import express from 'express';
import { recargarCartera, obtenerSaldo, obtenerHistorial } from '../controllers/cartera.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// POST /cartera/recarga - recargar saldo (simulado)
router.post('/recarga', authMiddleware, recargarCartera);

// GET /cartera/saldo - obtener saldo del usuario
router.get('/saldo', authMiddleware, obtenerSaldo);

// GET /cartera/historial - historial de transacciones
router.get('/historial', authMiddleware, obtenerHistorial);

export default router;
