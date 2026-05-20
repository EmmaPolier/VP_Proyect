/**
 * Rutas principales para administración
 * Agrupa todas las sub-rutas del panel admin
 */

import express from 'express';
import catalogsRoutes from './catalogs.routes.js';

const router = express.Router();

// Rutas de catálogos (tablas tipo)
router.use('/catalogs', catalogsRoutes);

// TODO: Agregar más rutas según se desarrollen
// router.use('/usuarios', usuariosRoutes);
// router.use('/vehiculos', vehiculosRoutes);
// router.use('/rutas', rutasRoutes);
// router.use('/solicitudes', solicitudesRoutes);
// router.use('/estadisticas', estadisticasRoutes);

export default router;
