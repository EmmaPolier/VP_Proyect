import express from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import {
  searchRoutes,
  createRoute,
  createSolicitud,
  getMySolicitudes,
  getPassengerDashboard,
  getDriverDashboard,
  getDriverSolicitudes,
  getDriverRoutes,
  updateSolicitudStatus,
  cancelSolicitud,
  finalizeRoute,
} from '../controllers/route.controller.js';

const router = express.Router();

// Rutas públicas de búsqueda de rutas
router.get('/search', searchRoutes);
router.post('/', authMiddleware, createRoute);

// Solicitudes de cupo - requieren autenticación
router.post('/:id/solicitudes', authMiddleware, createSolicitud);
router.post('/solicitudes/:id/:action', authMiddleware, updateSolicitudStatus);
router.post('/solicitudes/:id/cancelar', authMiddleware, cancelSolicitud);
router.get('/mis-rutas', authMiddleware, getDriverRoutes);
router.get('/dashboard', authMiddleware, getPassengerDashboard);
router.get('/driver-dashboard', authMiddleware, getDriverDashboard);
router.get('/solicitudes/mine', authMiddleware, getMySolicitudes);
router.get('/solicitudes/driver', authMiddleware, getDriverSolicitudes);
router.post('/:id/finalizar', authMiddleware, finalizeRoute);

export default router;
