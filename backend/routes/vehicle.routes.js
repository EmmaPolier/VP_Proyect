import express from 'express';
import { registerVehicle } from '../controllers/vehicle.controller.js';
import { getBrands, getModelsByBrand, createModel, getColors } from '../controllers/brand-model.controller.js';

const router = express.Router();

// ============================================================================
// RUTAS DE CATÁLOGOS (MARCA, MODELO, COLOR)
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
// RUTAS DE REGISTRO DE VEHÍCULOS
// ============================================================================

// POST /vehicles - Registrar nuevo vehículo
router.post('/', registerVehicle);

export default router;
