import express from 'express';
import { registerVehicle, getVehicles, deleteVehicle } from '../controllers/vehicle.controller.js';
import { getBrands, getModelsByBrand, createModel, getColors } from '../controllers/brand-model.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// ============================================================================
// RUTAS DE CATÁLOGOS (MARCA, MODELO, COLOR) - SIN AUTENTICACIÓN
// ============================================================================

// GET todas las marcas
router.get('/brands', getBrands);

// GET modelos por marca
router.get('/models', getModelsByBrand);

// POST crear un nuevo modelo (requiere marca)
router.post('/models', createModel);

// GET colores
router.get('/colors', getColors);

// ============================================================================
// RUTAS DE VEHÍCULOS - CON AUTENTICACIÓN
// ============================================================================

// GET /vehicles - Obtener vehículos del conductor autenticado
router.get('/', authMiddleware, getVehicles);

// POST /vehicles - Registrar nuevo vehículo
router.post('/', authMiddleware, registerVehicle);

// DELETE /vehicles/:id - Eliminar vehículo
router.delete('/:id', authMiddleware, deleteVehicle);

export default router;
