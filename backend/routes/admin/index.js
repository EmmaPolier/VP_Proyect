/**
 * Rutas principales para administración
 * Agrupa todas las sub-rutas del panel admin
 */

import express from 'express';
import catalogsRoutes from './catalogs.routes.js';
import usuariosRoutes from './usuarios.routes.js';
import vehiculosRoutes from './vehiculos.routes.js';
import menuRoutes from './menu.routes.js';

const router = express.Router();

// Rutas de catálogos (tablas tipo)
router.use('/catalogs', catalogsRoutes);

// Rutas de administración de datos maestros y entidades fuertes
router.use('/usuarios', usuariosRoutes);
router.use('/vehiculos', vehiculosRoutes);

// Rutas para gestión de menú y permisos
router.use('/menu', menuRoutes);

export default router;
