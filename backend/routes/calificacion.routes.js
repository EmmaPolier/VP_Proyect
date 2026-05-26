/**
 * Rutas para gestión de CALIFICACIONES
 */

import express from 'express';
import * as calificacionController from '../controllers/calificacion.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ============================================================================
// RUTAS PARA CALIFICACIONES
// ============================================================================

// Crear calificación
router.post('/', authMiddleware, calificacionController.createCalificacion);

// Obtener calificaciones de un usuario (con paginación)
router.get('/', calificacionController.getCalificaciones);

// Obtener estadísticas de un usuario
router.get('/:documento/estadisticas', calificacionController.getEstadisticasCalificacion);

// Obtener rating/promedio de un usuario
router.get('/:documento', calificacionController.getCalificacionUsuario);

export default router;
