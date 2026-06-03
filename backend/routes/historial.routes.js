import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  getHistorial,
  getHistorialDetalle,
  createHistorial
} from '../controllers/historial.controller.js';

const router = Router();

// GET - Listar historial del usuario autenticado
router.get('/historial', authMiddleware, getHistorial);

// GET - Detalle de historial específico
router.get('/historial/:id', authMiddleware, getHistorialDetalle);

// POST - Crear registro de historial (interno - solo para conductores/admin)
router.post('/historial', authMiddleware, createHistorial);

export default router;
